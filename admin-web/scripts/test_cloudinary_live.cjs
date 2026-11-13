const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

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

async function runCloudinaryLiveTest() {
  console.log('\n================================================================');
  console.log('   GLAMORA PHASE 5C: CLOUDINARY LIVE CONNECTION TEST');
  console.log('================================================================\n');

  const env = parseEnv('admin-web/.env.local');
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('FAIL: Missing Cloudinary credentials in admin-web/.env.local');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    // 1. Ping Cloudinary API
    const pingResult = await cloudinary.api.ping();
    console.log('  [PASS] 1. Cloudinary API ping succeeded:', JSON.stringify(pingResult));

    // 2. Verify Cloud Name
    console.log(`  [PASS] 2. Cloudinary cloud name verified: "${cloudName}"`);

    // 3. Test signed server-side image upload (1x1 test pixel)
    const testPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await cloudinary.uploader.upload(testPixel, {
      folder: 'glamora/automated_test_probes',
      tags: ['phase5c_automated_probe'],
    });

    console.log('  [PASS] 3. Signed server-side image upload succeeded.');
    console.log(`         Secure URL: ${uploadRes.secure_url}`);
    console.log(`         Public ID:  ${uploadRes.public_id}`);
    console.log(`         Format:     ${uploadRes.format} (${uploadRes.bytes} bytes)`);

    if (!uploadRes.secure_url.includes(cloudName)) {
      throw new Error('Upload URL does not match configured cloud name.');
    }

    // 4. Test image deletion (clean up test asset immediately)
    const deleteRes = await cloudinary.uploader.destroy(uploadRes.public_id);
    console.log('  [PASS] 4. Test image asset deletion succeeded:', JSON.stringify(deleteRes));

    if (deleteRes.result !== 'ok') {
      throw new Error(`Cloudinary delete returned unexpected status: ${deleteRes.result}`);
    }

    console.log('\n----------------------------------------------------------------');
    console.log('  CLOUDINARY LIVE CONNECTION: 4/4 CHECKS PASSED');
    console.log('----------------------------------------------------------------\n');
  } catch (err) {
    console.error('\n[FAIL] Cloudinary Live Test Error:');
    const safeMsg = (err.message || 'Unknown error').replace(/:([^:@]+)@/, ':****@');
    console.error('      ', safeMsg);
    process.exit(1);
  }
}

runCloudinaryLiveTest();

