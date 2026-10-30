import { roomMutex } from "../src/lib/concurrency/mutex";
import { isTimeRangeOverlapping, isValidTimeInterval } from "../src/lib/utils/date";

describe("Concurrency and Double-Booking Prevention Unit Tests", () => {
  test("Validates interval: endTime must be strictly after startTime", () => {
    expect(isValidTimeInterval("09:00", "10:00")).toBe(true);
    expect(isValidTimeInterval("10:00", "09:00")).toBe(false);
    expect(isValidTimeInterval("10:00", "10:00")).toBe(false);
  });

  test("Accurately detects overlapping time ranges", () => {
    // Overlapping: 10:00-11:00 vs 10:30-11:30
    expect(
      isTimeRangeOverlapping(
        "2026-11-01T10:00:00+07:00",
        "2026-11-01T11:00:00+07:00",
        "2026-11-01T10:30:00+07:00",
        "2026-11-01T11:30:00+07:00"
      )
    ).toBe(true);

    // Contained within: 09:00-12:00 vs 10:00-11:00
    expect(
      isTimeRangeOverlapping(
        "2026-11-01T09:00:00+07:00",
        "2026-11-01T12:00:00+07:00",
        "2026-11-01T10:00:00+07:00",
        "2026-11-01T11:00:00+07:00"
      )
    ).toBe(true);

    // Adjacent / Non-overlapping: 09:00-10:00 vs 10:00-11:00
    expect(
      isTimeRangeOverlapping(
        "2026-11-01T09:00:00+07:00",
        "2026-11-01T10:00:00+07:00",
        "2026-11-01T10:00:00+07:00",
        "2026-11-01T11:00:00+07:00"
      )
    ).toBe(false);

    // Completely separated: 08:00-09:00 vs 13:00-14:00
    expect(
      isTimeRangeOverlapping(
        "2026-11-01T08:00:00+07:00",
        "2026-11-01T09:00:00+07:00",
        "2026-11-01T13:00:00+07:00",
        "2026-11-01T14:00:00+07:00"
      )
    ).toBe(false);
  });

  test("Room Mutex sequential lock prevents concurrent race conditions", async () => {
    const roomId = "room_mutex_test_01";
    const executionOrder: number[] = [];

    // Worker 1 acquires lock and simulates work for 50ms
    const worker1 = async () => {
      const release = await roomMutex.acquire(roomId);
      executionOrder.push(1);
      await new Promise((r) => setTimeout(r, 50));
      executionOrder.push(1);
      release();
    };

    // Worker 2 attempts to acquire lock for same room at nearly same instant
    const worker2 = async () => {
      // Slight tick so worker1 gets lock first
      await new Promise((r) => setTimeout(r, 5));
      const release = await roomMutex.acquire(roomId);
      executionOrder.push(2);
      release();
    };

    await Promise.all([worker1(), worker2()]);

    // Worker 1 must enter and exit completely before Worker 2 enters
    expect(executionOrder).toEqual([1, 1, 2]);
  });

  test("Idempotency store caches and prevents repeated execution", () => {
    const testKey = "test_idempotency_123";
    expect(roomMutex.getIdempotencyResult(testKey)).toBeNull();

    roomMutex.saveIdempotencyResult(testKey, { bookingId: "bk_123" }, 201);

    const cached = roomMutex.getIdempotencyResult(testKey);
    expect(cached).not.toBeNull();
    expect(cached?.status).toBe(201);
    expect(cached?.response.bookingId).toBe("bk_123");
  });
});
