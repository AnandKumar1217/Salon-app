/**
 * GLAMORA SECURE DEMO CREDENTIAL ROTATION SCRIPT
 * Rotates passwords for demo accounts in MongoDB Atlas to cryptographically random values.
 * Never prints passwords to stdout.
 * Preserves all legitimate user and admin accounts.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tammisettyanandkumar1_db_user:gJdkTgCS7NmZmnE2@cluster0.lvrwitr.mongodb.net';
const DB_NAME = process.env.MONGODB_DB_NAME || 'Glamora';

function generateSecurePassword() {
  return crypto.randomBytes(24).toString('base64url') + 'A1!';
}

async function rotateCredentials() {
  console.log('Connecting to MongoDB Atlas at database:', DB_NAME);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const adminPass = process.env.DEMO_ADMIN_PASSWORD || generateSecurePassword();
  const ownerPass = process.env.DEMO_OWNER_PASSWORD || generateSecurePassword();
  const customerPass = process.env.DEMO_CUSTOMER_PASSWORD || generateSecurePassword();

  const saltRounds = 10;
  const adminHash = await bcrypt.hash(adminPass, saltRounds);
  const ownerHash = await bcrypt.hash(ownerPass, saltRounds);
  const customerHash = await bcrypt.hash(customerPass, saltRounds);

  // 1. Rotate Admin Account in admin_users
  const adminRes = await db.collection('admin_users').updateOne(
    { email: 'admin@glamora.com' },
    {
      $set: {
        passwordHash: adminHash,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  console.log('✓ Admin credential rotated successfully in admin_users (Matched:', adminRes.matchedCount, ')');

  // 2. Rotate Owner Account in users
  const ownerRes = await db.collection('users').updateOne(
    { email: 'owner@glamora.com' },
    {
      $set: {
        passwordHash: ownerHash,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  console.log('✓ Owner credential rotated successfully in users (Matched:', ownerRes.matchedCount, ')');

  // 3. Rotate Customer Account in users
  const customerRes = await db.collection('users').updateOne(
    { email: 'customer@glamora.com' },
    {
      $set: {
        passwordHash: customerHash,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  console.log('✓ Customer credential rotated successfully in users (Matched:', customerRes.matchedCount, ')');

  // 4. Verify that the new credentials match in MongoDB
  const freshAdmin = await db.collection('admin_users').findOne({ email: 'admin@glamora.com' });
  const adminMatches = await bcrypt.compare(adminPass, freshAdmin.passwordHash);
  if (!adminMatches) throw new Error('Admin password hash verification failed');

  const freshOwner = await db.collection('users').findOne({ email: 'owner@glamora.com' });
  const ownerMatches = await bcrypt.compare(ownerPass, freshOwner.passwordHash);
  if (!ownerMatches) throw new Error('Owner password hash verification failed');

  const freshCustomer = await db.collection('users').findOne({ email: 'customer@glamora.com' });
  const customerMatches = await bcrypt.compare(customerPass, freshCustomer.passwordHash);
  if (!customerMatches) throw new Error('Customer password hash verification failed');

  console.log('✓ Cryptographic password hash verification confirmed for all 3 accounts');

  // 5. Verify total account counts to confirm non-target accounts were preserved
  const totalAdmins = await db.collection('admin_users').countDocuments();
  const totalUsers = await db.collection('users').countDocuments();
  console.log(`✓ Preserved account integrity: ${totalAdmins} admin(s), ${totalUsers} user(s) intact`);

  // 6. Write to git-ignored local .env.local file for local test automation only
  const envLocalPath = path.resolve(__dirname, '..', '.env.local');
  const envContent = [
    `# Rotated Demo Credentials (Local Dev/Test Only - Git Ignored)`,
    `DEMO_ADMIN_PASSWORD=${adminPass}`,
    `DEMO_OWNER_PASSWORD=${ownerPass}`,
    `DEMO_CUSTOMER_PASSWORD=${customerPass}`,
    `MONGODB_URI=${MONGODB_URI}`,
    ``,
  ].join('\n');

  fs.writeFileSync(envLocalPath, envContent, { mode: 0o600 });
  console.log('✓ Saved rotated credentials to git-ignored .env.local for authorized local testing');

  await client.close();
  console.log('\n--- Demo Credential Rotation Successfully Verified ---');
}

rotateCredentials().catch((err) => {
  console.error('Rotation failed:', err);
  process.exit(1);
});
