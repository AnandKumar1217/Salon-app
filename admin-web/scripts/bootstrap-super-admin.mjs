#!/usr/bin/env node

/**
 * GLAMORA SUPER ADMIN BOOTSTRAP SCRIPT
 *
 * Secure initial provisioning for the first Super Administrator.
 * Architecture: MongoDB Atlas + bcrypt + Server-side RBAC
 * Zero Firebase dependencies.
 *
 * Usage:
 *   node scripts/bootstrap-super-admin.mjs <EMAIL> <PASSWORD> [FULL_NAME] [ROLE]
 *
 * Example:
 *   node scripts/bootstrap-super-admin.mjs admin@glamora.com SuperSecretPassword123! "Lead Admin" SUPER_ADMIN
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// Parse .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const adminEmail = process.argv[2];
const adminPassword = process.argv[3];
const adminName = process.argv[4] || 'Super Administrator';
const adminRole = process.argv[5] || 'SUPER_ADMIN';

if (!adminEmail || !adminPassword) {
  console.error('\n❌ ERROR: Missing required email or password.');
  console.error('Usage: node scripts/bootstrap-super-admin.mjs <EMAIL> <PASSWORD> [FULL_NAME] [ROLE]\n');
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/glamora';
const dbName = process.env.MONGODB_DB_NAME || 'glamora';

console.log('========================================================');
console.log('  GLAMORA SECURE SUPER ADMIN INITIAL BOOTSTRAPPER');
console.log('  Database: MongoDB Atlas | Auth: bcrypt + JWT RBAC');
console.log('========================================================');
console.log(`Target Email:  ${adminEmail}`);
console.log(`Target Name:   ${adminName}`);
console.log(`Assigned Role: ${adminRole}`);
console.log('--------------------------------------------------------');

async function run() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    console.log('1. Connecting to MongoDB Atlas...');
    await client.connect();
    const db = client.db(dbName);
    console.log(`   Connected successfully to database: ${db.databaseName}`);

    console.log('2. Hashing administrator password with bcrypt (cost factor 10)...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const cleanEmail = adminEmail.toLowerCase().trim();
    const adminUser = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: adminName,
      passwordHash,
      role: adminRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    console.log('3. Upserting Super Admin record in admin_users collection...');
    await db.collection('admin_users').updateOne(
      { email: cleanEmail },
      {
        $set: {
          name: adminName,
          passwordHash,
          role: adminRole,
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          id: adminUser.id,
          email: cleanEmail,
          createdAt: adminUser.createdAt,
        },
      },
      { upsert: true }
    );

    console.log('4. Writing immutable security audit log entry...');
    await db.collection('admin_audit_logs').insertOne({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId: 'system_cli_bootstrapper',
      adminEmail: 'cli@glamora.system',
      adminRole: 'SUPER_ADMIN',
      action: 'BOOTSTRAP_ADMIN_USER',
      targetCollection: 'admin_users',
      targetId: cleanEmail,
      newValue: { email: cleanEmail, role: adminRole, isActive: true },
      reason: 'CLI administrator bootstrap execution',
      timestamp: new Date().toISOString(),
      result: 'SUCCESS',
    });

    console.log('--------------------------------------------------------');
    console.log('✅ SUPER ADMIN BOOTSTRAP COMPLETE!');
    console.log(`   Admin "${cleanEmail}" is now ready to log in.`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
