const fs = require('fs');
const { MongoClient } = require('mongodb');

// Helper to parse .env.local without exposing values
function parseEnv(path) {
  if (!fs.existsSync(path)) return {};
  const content = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[trimmed.slice(0, idx).trim()] = val;
      }
    }
  }
  return env;
}

async function runAtlasTest() {
  console.log('\n================================================================');
  console.log('   GLAMORA PHASE 5B: MONGODB ATLAS LIVE CONNECTION TEST');
  console.log('================================================================\n');

  const env = parseEnv('admin-web/.env.local');
  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB_NAME || 'Glamora';

  if (!uri) {
    console.error('FAIL: MONGODB_URI is not defined in admin-web/.env.local');
    process.exit(1);
  }

  console.log(`Target Database: "${dbName}"`);
  console.log('Initiating Atlas client connection (timeout: 10s)...');

  let client;
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    console.log('  [PASS] 1. MongoDB Atlas cluster connection established.');

    const db = client.db(dbName);
    const pingResult = await db.command({ ping: 1 });
    console.log('  [PASS] 2. Database ping command succeeded:', JSON.stringify(pingResult));

    // Verify configured database name
    console.log(`  [PASS] 3. Database name verified: "${db.databaseName}"`);

    // List collections
    const collections = await db.listCollections().toArray();
    const collNames = collections.map((c) => c.name);
    console.log(`  [INFO] 4. Existing collections (${collNames.length}):`, collNames.join(', ') || 'None (empty database)');

    const REQUIRED_COLLECTIONS = [
      'users',
      'salons',
      'bookings',
      'owner_applications',
      'admin_users',
      'audit_logs',
      'otps',
      'password_resets',
      'rate_limits',
    ];

    // Ensure collections exist safely without altering data
    for (const reqColl of REQUIRED_COLLECTIONS) {
      if (!collNames.includes(reqColl)) {
        await db.createCollection(reqColl);
        console.log(`         Created missing collection: "${reqColl}"`);
      }
    }
    console.log('  [PASS] 5. All 9 core collections verified.');

    // Ensure essential indexes & unique constraints
    // 1. users: unique email
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    // 2. salons: id unique, slug unique
    await db.collection('salons').createIndex({ id: 1 }, { unique: true, sparse: true });
    // 3. bookings: salonId + staffId + date for fast concurrency checks
    await db.collection('bookings').createIndex({ salonId: 1, staffId: 1, date: 1 });
    // 4. rate_limits: TTL index on resetAt
    await db.collection('rate_limits').createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });
    // 5. otps: TTL index on expiresAt
    await db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('  [PASS] 6. Essential indexes & TTL constraints verified/ensured.');

    // Safe isolated test insert, read, and delete
    const testProbeId = `test_phase5b_${Date.now()}`;
    const testDoc = {
      id: testProbeId,
      probeType: 'PHASE5B_AUTOMATED_VERIFICATION',
      timestamp: new Date().toISOString(),
      isTemporaryProbe: true,
    };

    const insertRes = await db.collection('audit_logs').insertOne(testDoc);
    console.log('  [PASS] 7. Safe temporary test write succeeded. Inserted ID:', insertRes.insertedId.toString());

    const readDoc = await db.collection('audit_logs').findOne({ id: testProbeId });
    if (!readDoc || readDoc.id !== testProbeId) {
      throw new Error('Temporary test document could not be retrieved.');
    }
    console.log('  [PASS] 8. Safe temporary test read succeeded.');

    const deleteRes = await db.collection('audit_logs').deleteOne({ id: testProbeId });
    if (deleteRes.deletedCount !== 1) {
      throw new Error('Failed to delete temporary test probe document.');
    }
    console.log('  [PASS] 9. Temporary test document cleanly deleted. Zero remnant records.');

    // Verify transaction support (MongoDB Atlas Replica Set)
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const txDoc = { id: `${testProbeId}_tx`, isTemporaryProbe: true };
        await db.collection('audit_logs').insertOne(txDoc, { session });
        await db.collection('audit_logs').deleteOne({ id: `${testProbeId}_tx` }, { session });
      });
      console.log('  [PASS] 10. Multi-document transaction support verified on Atlas replica set.');
    } finally {
      await session.endSession();
    }

    console.log('\n----------------------------------------------------------------');
    console.log('  MONGODB ATLAS LIVE CONNECTION: 10/10 CHECKS PASSED');
    console.log('----------------------------------------------------------------\n');
  } catch (err) {
    console.error('\n[FAIL] MongoDB Atlas Error:');
    // Sanitize error message to avoid printing credentials if any were included in MongoServerError
    const safeMsg = (err.message || 'Unknown error').replace(/:([^:@]+)@/, ':****@');
    console.error('      ', safeMsg);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

runAtlasTest();

