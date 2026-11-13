const fs = require('fs');

function parseEnv(path) {
  if (!fs.existsSync(path)) return {};
  const content = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  }
  return env;
}

const adminEnv = parseEnv('admin-web/.env.local');
const mobileEnv = parseEnv('Galmora/.env');

console.log('=== PHASE 5A: ENVIRONMENT VALIDATION REPORT ===\n');

// 1. Cloudinary Cloud Name match
const cloudMatch = adminEnv.CLOUDINARY_CLOUD_NAME === mobileEnv.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
console.log('1. Cloudinary Cloud Name Consistency:');
console.log(`   admin-web: "${adminEnv.CLOUDINARY_CLOUD_NAME || ''}"`);
console.log(`   Galmora:   "${mobileEnv.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || ''}"`);
console.log(`   Status:    ${cloudMatch ? 'MATCH (VERIFIED)' : 'MISMATCH (WARNING)'}\n`);

// 2. Mock fallbacks
console.log('2. Mock Fallback Flags:');
console.log(`   admin-web NEXT_PUBLIC_USE_MOCK_FALLBACK: "${adminEnv.NEXT_PUBLIC_USE_MOCK_FALLBACK}" (${adminEnv.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'false' ? 'DISABLED - VERIFIED' : 'ACTIVE'})`);
console.log(`   Galmora EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK: "${mobileEnv.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK}" (${mobileEnv.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK === 'false' ? 'DISABLED - VERIFIED' : 'ACTIVE'})\n`);

// 3. JWT & Session secrets
console.log('3. JWT & Session Cookie Cryptographic Secrets:');
const jwtLen = (adminEnv.JWT_SECRET || '').length;
const sessLen = (adminEnv.SESSION_COOKIE_SECRET || '').length;
const areDistinct = adminEnv.JWT_SECRET !== adminEnv.SESSION_COOKIE_SECRET;
console.log(`   JWT_SECRET length: ${jwtLen} chars (${jwtLen >= 32 ? 'VERIFIED >= 32' : 'FAIL'})`);
console.log(`   SESSION_COOKIE_SECRET length: ${sessLen} chars (${sessLen >= 32 ? 'VERIFIED >= 32' : 'FAIL'})`);
console.log(`   Secrets are distinct: ${areDistinct ? 'VERIFIED' : 'WARNING: SAME SECRET USED'}\n`);

// 4. Backend API URL in mobile .env
console.log('4. Mobile Backend API URL Configuration:');
const mobileUrl = mobileEnv.EXPO_PUBLIC_BACKEND_API_URL || '';
const isLocal = mobileUrl.includes('localhost') || mobileUrl.includes('127.0.0.1') || mobileUrl.includes('192.168.') || mobileUrl.includes('10.');
console.log(`   Configured URL: "${mobileUrl}"`);
console.log(`   Is Local/LAN:   ${isLocal ? 'YES (Development target)' : 'NO (Production domain)'}\n`);

// 5. MongoDB Atlas Connection Parameters:
console.log('5. MongoDB Atlas Connection Parameters:');
let mongoUri = adminEnv.MONGODB_URI || '';
if ((mongoUri.startsWith('"') && mongoUri.endsWith('"')) || (mongoUri.startsWith("'") && mongoUri.endsWith("'"))) {
  mongoUri = mongoUri.slice(1, -1);
}
const isAtlas = mongoUri.startsWith('mongodb+srv://');
const isDirect = mongoUri.startsWith('mongodb://');
console.log(`   Scheme:         ${isAtlas ? 'mongodb+srv:// (Atlas SRV Connection)' : isDirect ? 'mongodb:// (Direct Connection)' : 'Prefix: ' + mongoUri.slice(0, 14)}`);
console.log(`   Database Name:  "${adminEnv.MONGODB_DB_NAME || ''}"\n`);

// 6. Cloudinary API Credentials presence
console.log('6. Cloudinary API Key & Secret (Server-side):');
console.log(`   CLOUDINARY_API_KEY present:    ${!!adminEnv.CLOUDINARY_API_KEY} (length: ${(adminEnv.CLOUDINARY_API_KEY || '').length})`);
console.log(`   CLOUDINARY_API_SECRET present: ${!!adminEnv.CLOUDINARY_API_SECRET} (length: ${(adminEnv.CLOUDINARY_API_SECRET || '').length})\n`);

// 7. Git exclusion check
console.log('7. Git Exclusion Check (.gitignore):');
const rootGitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
const adminGitignore = fs.existsSync('admin-web/.gitignore') ? fs.readFileSync('admin-web/.gitignore', 'utf8') : '';
const mobileGitignore = fs.existsSync('Galmora/.gitignore') ? fs.readFileSync('Galmora/.gitignore', 'utf8') : '';

const allGitignore = rootGitignore + '\n' + adminGitignore + '\n' + mobileGitignore;
const envIgnored = allGitignore.includes('.env*.local') || allGitignore.includes('.env.local') || allGitignore.includes('.env');
console.log(`   .env / .env.local ignored in repository: ${envIgnored ? 'VERIFIED' : 'CHECK NEEDED'}`);
