/**
 * Live End-to-End System Verification Script
 * Validates actual running server, APIs, Concurrency Locks, and RBAC
 */

async function run() {
  const baseUrl = "http://localhost:3000";
  console.log("🔍 Starting Live E2E Verification on " + baseUrl + "...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  console.log("1. Testing /api/system/health...");
  const healthRes = await fetch(`${baseUrl}/api/system/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, "Health endpoint returns HTTP 200");
  assert(healthData.status === "healthy", "Health status is 'healthy'");
  assert(healthData.database.ok === true, "Database is initialized and healthy");

  // 2. Authentication: Login as Admin
  console.log("\n2. Testing /api/auth/login...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie");
  assert(loginRes.status === 200 && loginData.success, "Admin login successful");
  assert(loginData.user.role === "Admin", "User role returned is Admin");
  assert(!!setCookie, "Auth cookie is set by server");

  const authToken = loginData.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  // 3. Verify /api/auth/me
  console.log("\n3. Testing /api/auth/me with Bearer token...");
  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  assert(meRes.status === 200, "Me endpoint returns 200 with valid session");
  assert(meData.user.username === "admin", "Session resolves to admin user");

  // 4. Test Rooms Endpoint
  console.log("\n4. Testing /api/rooms...");
  const roomsRes = await fetch(`${baseUrl}/api/rooms`, { headers: authHeaders });
  const roomsData = await roomsRes.json();
  assert(roomsRes.status === 200, "Rooms endpoint returns 200");
  assert(roomsData.rooms.length >= 5, `Found ${roomsData.rooms.length} active rooms`);
  const targetRoom = roomsData.rooms[0];

  // 5. Create Booking in an available slot
  console.log("\n5. Testing Booking Creation (Happy Path)...");
  const testDate = "2026-12-15";
  const booking1Res = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      roomId: targetRoom.roomId,
      title: "E2E Live Verification Meeting A",
      date: testDate,
      startTime: "10:00",
      endTime: "11:30",
      attendeesCount: 5,
      purpose: "E2E automated testing",
      equipment: ["Projector 4K"],
    }),
  });
  const booking1Data = await booking1Res.json();
  assert(
    booking1Res.status === 201,
    `Booking created successfully (ID: ${booking1Data.booking?.bookingId}, Status: ${booking1Data.booking?.status})`
  );

  // 6. Test Double-Booking Prevention (Should be rejected with HTTP 409 Conflict)
  console.log("\n6. Testing Double-Booking Prevention (Overlapping Time)...");
  const conflictRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      roomId: targetRoom.roomId,
      title: "Conflicting Meeting B (Should Fail)",
      date: testDate,
      startTime: "10:30", // Overlaps with 10:00-11:30!
      endTime: "12:00",
      attendeesCount: 4,
      purpose: "Conflicting request",
    }),
  });
  const conflictData = await conflictRes.json();
  assert(
    conflictRes.status === 409,
    `Double-booking prevented with HTTP 409 Conflict: "${conflictData.error}"`
  );

  // 7. Test Attendees Count Exceeding Capacity
  console.log("\n7. Testing Capacity Validation...");
  const capacityRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      roomId: targetRoom.roomId,
      title: "Huge Crowd Meeting",
      date: testDate,
      startTime: "14:00",
      endTime: "15:00",
      attendeesCount: targetRoom.capacity + 50, // Exceeds capacity
      purpose: "Testing capacity rejection",
    }),
  });
  assert(
    capacityRes.status === 400,
    "Capacity violation rejected with HTTP 400"
  );

  // 8. Test Reports API
  console.log("\n8. Testing /api/reports Aggregation...");
  const reportsRes = await fetch(`${baseUrl}/api/reports`, { headers: authHeaders });
  const reportsData = await reportsRes.json();
  assert(reportsRes.status === 200, "Reports endpoint returns 200");
  assert(reportsData.summary.total > 0, `Total bookings counted: ${reportsData.summary.total}`);
  assert(Array.isArray(reportsData.roomStats), "Room statistics returned");

  // 9. Test Audit Logs API
  console.log("\n9. Testing /api/audit-logs...");
  const auditRes = await fetch(`${baseUrl}/api/audit-logs`, { headers: authHeaders });
  const auditData = await auditRes.json();
  assert(auditRes.status === 200, "Audit logs endpoint returns 200");
  assert(auditData.logs.length > 0, `Audit logs captured ${auditData.logs.length} events`);

  console.log("\n==========================================");
  console.log(`🏁 Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
