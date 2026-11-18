/**
 * Activity Requests Automated Verification Test
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import { TEST_ADMIN_PASSWORD, TEST_OWNER_PASSWORD } from './test_env.ts';

const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';

async function run() {
  console.log('Testing Activity Requests API...');
  const timestamp = Date.now();

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `198.51.100.${(timestamp % 200) + 1}` },
    body: JSON.stringify({ email: 'admin@glamora.com', password: TEST_ADMIN_PASSWORD }),
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  const ownerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `198.51.100.${(timestamp % 200) + 2}` },
    body: JSON.stringify({ email: 'owner@glamora.com', password: TEST_OWNER_PASSWORD }),
  });
  const ownerData = await ownerLoginRes.json();
  const ownerToken = ownerData.token;

  // 1. Submit Activity Request
  const postRes = await fetch(`${BASE_URL}/api/activity-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      salonId: 'salon_test_1',
      salonName: 'Elite Salon Studio',
      requestType: 'BRANCH_EXPANSION',
      title: 'New Branch in Indiranagar',
      description: 'Expanding operations to second commercial floor with 5 additional styling chairs.',
      ownerName: 'Test Owner',
      ownerEmail: 'owner@test.com',
    }),
  });

  const postData = await postRes.json();
  if (!postRes.ok || !postData.success) {
    throw new Error(`Failed to create activity request: ${JSON.stringify(postData)}`);
  }
  console.log(' [PASS] 1. POST /api/activity-requests created request ID:', postData.request.id);
  const reqId = postData.request.id;

  // 2. GET Activity Requests as Admin
  const getAdminRes = await fetch(`${BASE_URL}/api/activity-requests`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const getAdminData = await getAdminRes.json();
  if (!getAdminRes.ok || !getAdminData.success || !Array.isArray(getAdminData.requests)) {
    throw new Error(`Admin failed to fetch activity requests: ${JSON.stringify(getAdminData)}`);
  }
  console.log(` [PASS] 2. GET /api/activity-requests as Super Admin returned ${getAdminData.requests.length} requests`);

  // 3. GET Activity Requests as Owner
  const getOwnerRes = await fetch(`${BASE_URL}/api/activity-requests`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const getOwnerData = await getOwnerRes.json();
  if (!getOwnerRes.ok || !getOwnerData.success) {
    throw new Error(`Owner failed to fetch activity requests: ${JSON.stringify(getOwnerData)}`);
  }
  console.log(` [PASS] 3. GET /api/activity-requests as Owner returned ${getOwnerData.requests.length} requests`);

  // 4. Approve Activity Request as Admin
  const approveRes = await fetch(`${BASE_URL}/api/activity-requests/${reqId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.success || approveData.request.status !== 'APPROVED') {
    throw new Error(`Failed to approve activity request: ${JSON.stringify(approveData)}`);
  }
  console.log(' [PASS] 4. POST /api/activity-requests/[id]/approve approved request successfully');

  // 5. Submit another request to test rejection with mandatory reason
  const postRes2 = await fetch(`${BASE_URL}/api/activity-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      salonId: 'salon_test_1',
      salonName: 'Elite Salon Studio',
      requestType: 'DOCUMENT_UPDATE',
      title: 'Updated Trade License',
      description: 'Submitted revised municipal trade license.',
      ownerName: 'Test Owner',
    }),
  });
  const postData2 = await postRes2.json();
  const reqId2 = postData2.request.id;

  // Reject without reason (should fail)
  const rejectFailRes = await fetch(`${BASE_URL}/api/activity-requests/${reqId2}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: 'no' }),
  });
  if (rejectFailRes.status !== 400) {
    throw new Error('Rejection without valid reason did not return 400');
  }
  console.log(' [PASS] 5. POST /api/activity-requests/[id]/reject rejected without valid reason returns 400');

  // Reject with valid reason
  const rejectPassRes = await fetch(`${BASE_URL}/api/activity-requests/${reqId2}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: 'License image is blurry. Please upload high-resolution scan.' }),
  });
  const rejectPassData = await rejectPassRes.json();
  if (!rejectPassRes.ok || !rejectPassData.success || rejectPassData.request.status !== 'REJECTED') {
    throw new Error(`Rejection with reason failed: ${JSON.stringify(rejectPassData)}`);
  }
  console.log(' [PASS] 6. POST /api/activity-requests/[id]/reject rejected with mandatory reason logged');

  console.log('\n--- All 6 Activity Requests Integration Tests Passed! ---\n');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
