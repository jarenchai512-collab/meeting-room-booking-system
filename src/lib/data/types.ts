export type UserRole = "Admin" | "Approver" | "Inspector" | "Endorser" | "User";

export type BookingStatus =
  | "Pending"
  | "Inspected"
  | "Endorsed"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export interface User {
  userId: string;
  username: string;
  passwordHash?: string;
  name: string;
  prefix?: "นาย" | "นาง" | "นางสาว" | string;
  position?: string;
  email: string;
  phoneNumber?: string;
  department: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  roomId: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  equipmentList: string[];
  isAvailable: boolean;
  color: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  bookingId: string;
  title: string; // เพื่อใช้ในการดำเนินงาน เรื่อง
  roomId: string; // 6 ห้องหลัก หรือ room_other
  roomName: string;
  otherRoomDetail?: string; // ระบุห้องอื่นๆ กรณีเลือก อื่นๆ

  // Requester Info ตามใบคำขอ
  requesterPrefix?: string; // นาย / นาง / นางสาว
  bookedBy: string; // ชื่อ-นามสกุล
  position?: string; // ตำแหน่ง
  department: string; // หน่วยงาน / สาขาวิชา
  phoneNumber?: string; // หมายเลขโทรศัพท์
  bookedByEmail: string;
  writtenDate?: string; // เขียนวันที่ (เช่น 30 ตุลาคม 2569)

  // วันและเวลา
  date: string; // YYYY-MM-DD
  endDate?: string; // กำหนดการใช้งานถึงวันที่
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDateTime: string; // ISO 8601 in Asia/Bangkok
  endDateTime: string; // ISO 8601 in Asia/Bangkok
  attendeesCount: number; // จำนวนผู้เข้าใช้ (โดยประมาณ)

  // ครุภัณฑ์และอุปกรณ์ 6 รายการ + อื่นๆ
  equipment: string[]; // ["เครื่องฉายภาพ (Projector)", "ระบบเสียง", "ไมโครโฟน", "เครื่องปรับอากาศ", "อินเทอร์เน็ต", "โต๊ะ/เก้าอี้เพิ่มเติม", "อื่น ๆ"]
  tableChairCount?: number; // โต๊ะ/เก้าอี้เพิ่มเติม ..... ตัว
  otherEquipment?: string; // อุปกรณ์อื่นๆ ระบุ

  // คำรับรอง
  assetAgreementConfirmed?: boolean; // ข้าพเจ้าขอรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ...

  purpose?: string;
  notes?: string;
  fileAttachmentUrl?: string;
  fileAttachmentId?: string;
  fileName?: string;

  // สถานะรวม
  status: BookingStatus;
  rejectionReason?: string;

  // 3-Stage Approval Tracking
  // ระดับที่ 1: เจ้าหน้าที่ผู้ตรวจสอบห้อง (นายวัชรพงศ์ โสภา)
  inspectionInspector?: string;
  inspectionStatus?: "pending" | "ready" | "not_ready"; // พร้อมใช้งาน / ไม่พร้อมใช้งาน
  inspectionNote?: string;
  inspectionDate?: string;

  // ระดับที่ 2: หัวหน้างาน/ผู้รับรอง (นายเอกราช เขียวทอง)
  endorserName?: string;
  endorsementStatus?: "pending" | "endorsed" | "rejected";
  endorsementNote?: string;
  endorsementDate?: string;

  // ระดับที่ 3: ผู้พิจารณาอนุมัติ (นายชาตรี เริงชัยภูมิ)
  approvedBy?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedAt?: string;

  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "booking_created"
  | "booking_inspected"
  | "booking_endorsed"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled"
  | "reminder"
  | "system";

export interface AppNotification {
  notificationId: string;
  recipientUserId: string;
  recipientRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
}

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description: string;
  updatedAt: string;
}

export interface BookingFilter {
  dateFrom?: string;
  dateTo?: string;
  roomId?: string;
  department?: string;
  status?: BookingStatus;
  bookedByEmail?: string;
  search?: string;
  page?: number;
  limit?: number;
}
