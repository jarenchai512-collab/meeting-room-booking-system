import { LocalStoreDataSource } from "../src/lib/data/local-store";
import { Booking } from "../src/lib/data/types";

/** Helper to build a minimal valid Booking object for tests */
function makeBooking(overrides: Partial<Booking> & { bookingId: string; date: string; startTime: string; endTime: string }): Booking {
  return {
    title: "Test Meeting",
    roomId: "room_01",
    roomName: "หอประชุมอดิเรกสาร",
    bookedBy: "Test User",
    bookedByEmail: "test@vtc.ac.th",
    department: "แผนกวิชาช่างยนต์",
    attendeesCount: 10,
    purpose: "Testing booking lifecycle",
    equipment: [],
    status: "Pending",
    assetAgreementConfirmed: true,
    inspectionStatus: "pending",
    endorsementStatus: "pending",
    startDateTime: `${overrides.date}T${overrides.startTime}:00+07:00`,
    endDateTime: `${overrides.date}T${overrides.endTime}:00+07:00`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Booking Lifecycle and Data Store Integration Tests", () => {
  let db: LocalStoreDataSource;

  beforeAll(async () => {
    db = new LocalStoreDataSource();
    await db.init();
  });

  test("Creates booking in Pending status and queries it", async () => {
    const newBooking = makeBooking({
      bookingId: `test_bk_${Date.now()}`,
      title: "Unit Test Board Meeting",
      date: "2026-11-20",
      startTime: "14:00",
      endTime: "16:00",
    });

    const created = await db.createBooking(newBooking);
    expect(created.bookingId).toBe(newBooking.bookingId);

    const retrieved = await db.getBookingById(newBooking.bookingId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.status).toBe("Pending");
    expect(retrieved?.title).toBe("Unit Test Board Meeting");
  });

  test("Approves booking and updates status", async () => {
    const bookingId = `test_bk_approve_${Date.now()}`;
    await db.createBooking(makeBooking({
      bookingId,
      title: "To Be Approved",
      roomId: "room_02",
      roomName: "ห้องประชุมสักทอง",
      date: "2026-11-21",
      startTime: "10:00",
      endTime: "11:00",
    }));

    const updated = await db.updateBooking(bookingId, {
      status: "Approved",
      approvedBy: "Approver Name",
      approvedAt: new Date().toISOString(),
    });

    expect(updated?.status).toBe("Approved");
    expect(updated?.approvedBy).toBe("Approver Name");
  });

  test("Rejects booking with reason", async () => {
    const bookingId = `test_bk_reject_${Date.now()}`;
    await db.createBooking(makeBooking({
      bookingId,
      title: "To Be Rejected",
      roomId: "room_02",
      roomName: "ห้องประชุมสักทอง",
      date: "2026-11-22",
      startTime: "10:00",
      endTime: "11:00",
    }));

    const updated = await db.updateBooking(bookingId, {
      status: "Rejected",
      rejectionReason: "ห้องปิดซ่อมบำรุงระบบปรับอากาศ",
      approvedBy: "Approver Name",
    });

    expect(updated?.status).toBe("Rejected");
    expect(updated?.rejectionReason).toBe("ห้องปิดซ่อมบำรุงระบบปรับอากาศ");
  });

  test("Cancels booking", async () => {
    const bookingId = `test_bk_cancel_${Date.now()}`;
    await db.createBooking(makeBooking({
      bookingId,
      title: "To Be Cancelled",
      roomId: "room_02",
      roomName: "ห้องประชุมสักทอง",
      date: "2026-11-23",
      startTime: "10:00",
      endTime: "11:00",
    }));

    const updated = await db.updateBooking(bookingId, {
      status: "Cancelled",
    });

    expect(updated?.status).toBe("Cancelled");
  });

  test("3-stage approval: Pending → Inspected → Endorsed → Approved", async () => {
    const bookingId = `test_bk_3stage_${Date.now()}`;
    await db.createBooking(makeBooking({
      bookingId,
      title: "3-Stage Approval Test",
      date: "2026-11-24",
      startTime: "09:00",
      endTime: "10:00",
    }));

    // Stage 1: Inspector marks room as inspected
    const stage1 = await db.updateBooking(bookingId, {
      status: "Inspected",
      inspectionStatus: "ready",
      inspectionInspector: "นายวัชรพงศ์ โสภา",
      inspectionDate: new Date().toISOString(),
    });
    expect(stage1?.status).toBe("Inspected");
    expect(stage1?.inspectionStatus).toBe("ready");

    // Stage 2: Endorser endorses
    const stage2 = await db.updateBooking(bookingId, {
      status: "Endorsed",
      endorsementStatus: "endorsed",
      endorserName: "นายเอกราช เขียวทอง",
      endorsementDate: new Date().toISOString(),
    });
    expect(stage2?.status).toBe("Endorsed");

    // Stage 3: Final approval
    const stage3 = await db.updateBooking(bookingId, {
      status: "Approved",
      approvedBy: "นายชาตรี เริงชัยภูมิ",
      approvedAt: new Date().toISOString(),
    });
    expect(stage3?.status).toBe("Approved");
  });
});
