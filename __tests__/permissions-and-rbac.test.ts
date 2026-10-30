import {
  canManageRooms,
  canManageUsers,
  canApproveOrReject,
  canModifyBooking,
  canCancelBooking,
  canViewAuditLogs,
  canInspectRoom,
  canEndorse,
} from "../src/lib/auth/permissions";
import { Booking } from "../src/lib/data/types";
import { TokenPayload } from "../src/lib/auth/jwt";

describe("Role-Based Access Control (RBAC) Permissions Tests", () => {
  const adminUser: TokenPayload = {
    userId: "usr_admin",
    username: "admin",
    name: "ผู้ดูแลระบบ",
    email: "admin@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Admin",
  };

  const approverUser: TokenPayload = {
    userId: "usr_chatree",
    username: "chatree",
    name: "นายชาตรี เริงชัยภูมิ",
    email: "chatree@thaluang.ac.th",
    department: "ฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
    role: "Approver",
  };

  const inspectorUser: TokenPayload = {
    userId: "usr_watcharapong",
    username: "watcharapong",
    name: "นายวัชรพงศ์ โสภา",
    email: "watcharapong@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Inspector",
  };

  const endorserUser: TokenPayload = {
    userId: "usr_ekarat",
    username: "ekarat",
    name: "นายเอกราช เขียวทอง",
    email: "ekarat@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Endorser",
  };

  const regularUser: TokenPayload = {
    userId: "usr_user",
    username: "somchai",
    name: "นายสมชาย ใจดี",
    email: "somchai@vtc.ac.th",
    department: "แผนกวิชาช่างยนต์",
    role: "User",
  };

  const otherUser: TokenPayload = {
    userId: "usr_other",
    username: "other",
    name: "Other User",
    email: "other@vtc.ac.th",
    department: "แผนกวิชาช่างไฟฟ้า",
    role: "User",
  };

  const sampleBooking: Booking = {
    bookingId: "bk_001",
    title: "ประชุมวางแผนรายไตรมาส",
    roomId: "room_01",
    roomName: "หอประชุมอดิเรกสาร",
    bookedBy: "นายสมชาย ใจดี",
    bookedByEmail: "somchai@vtc.ac.th",
    department: "แผนกวิชาช่างยนต์",
    date: "2026-11-10",
    startTime: "10:00",
    endTime: "12:00",
    startDateTime: "2026-11-10T10:00:00+07:00",
    endDateTime: "2026-11-10T12:00:00+07:00",
    attendeesCount: 5,
    purpose: "Planning",
    equipment: [],
    status: "Pending",
    assetAgreementConfirmed: true,
    inspectionStatus: "pending",
    endorsementStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test("Admin privileges — full access", () => {
    expect(canManageRooms(adminUser.role)).toBe(true);
    expect(canManageUsers(adminUser.role)).toBe(true);
    expect(canApproveOrReject(adminUser.role)).toBe(true);
    expect(canInspectRoom(adminUser.role)).toBe(true);
    expect(canEndorse(adminUser.role)).toBe(true);
    expect(canViewAuditLogs(adminUser.role)).toBe(true);
    expect(canModifyBooking(adminUser, sampleBooking)).toBe(true);
    expect(canCancelBooking(adminUser, sampleBooking)).toBe(true);
  });

  test("Approver (ผู้อนุมัติ) privileges", () => {
    expect(canManageRooms(approverUser.role)).toBe(false);
    expect(canManageUsers(approverUser.role)).toBe(false);
    expect(canApproveOrReject(approverUser.role)).toBe(true);
    expect(canEndorse(approverUser.role)).toBe(true);
    expect(canViewAuditLogs(approverUser.role)).toBe(false);
  });

  test("Inspector (ผู้ตรวจห้อง) privileges", () => {
    expect(canManageRooms(inspectorUser.role)).toBe(false);
    expect(canManageUsers(inspectorUser.role)).toBe(false);
    expect(canInspectRoom(inspectorUser.role)).toBe(true);
    expect(canApproveOrReject(inspectorUser.role)).toBe(true);
    expect(canEndorse(inspectorUser.role)).toBe(false);
    expect(canViewAuditLogs(inspectorUser.role)).toBe(false);
  });

  test("Endorser (ผู้รับรอง) privileges", () => {
    expect(canManageRooms(endorserUser.role)).toBe(false);
    expect(canManageUsers(endorserUser.role)).toBe(false);
    expect(canEndorse(endorserUser.role)).toBe(true);
    expect(canApproveOrReject(endorserUser.role)).toBe(true);
    expect(canInspectRoom(endorserUser.role)).toBe(false);
    expect(canViewAuditLogs(endorserUser.role)).toBe(false);
  });

  test("Regular User privileges", () => {
    expect(canManageRooms(regularUser.role)).toBe(false);
    expect(canManageUsers(regularUser.role)).toBe(false);
    expect(canApproveOrReject(regularUser.role)).toBe(false);
    expect(canInspectRoom(regularUser.role)).toBe(false);
    expect(canEndorse(regularUser.role)).toBe(false);
    expect(canViewAuditLogs(regularUser.role)).toBe(false);

    // Creator can modify their own Pending booking
    expect(canModifyBooking(regularUser, sampleBooking)).toBe(true);
    expect(canCancelBooking(regularUser, sampleBooking)).toBe(true);

    // Another user CANNOT modify or cancel someone else's booking
    expect(canModifyBooking(otherUser, sampleBooking)).toBe(false);
    expect(canCancelBooking(otherUser, sampleBooking)).toBe(false);
  });

  test("User can cancel Inspected/Endorsed booking (own)", () => {
    const inspectedBooking: Booking = {
      ...sampleBooking,
      status: "Inspected",
    };
    expect(canCancelBooking(regularUser, inspectedBooking)).toBe(true);
    expect(canCancelBooking(otherUser, inspectedBooking)).toBe(false);

    const endorsedBooking: Booking = {
      ...sampleBooking,
      status: "Endorsed",
    };
    expect(canCancelBooking(regularUser, endorsedBooking)).toBe(true);
  });
});
