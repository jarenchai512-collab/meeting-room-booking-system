import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { IDataSource } from "./data-source.interface";
import {
  Booking,
  Room,
  User,
  AppNotification,
  AuditLog,
  SystemSetting,
  BookingFilter,
} from "./types";
import { isTimeRangeOverlapping } from "../utils/date";

interface DatabaseFile {
  bookings: Booking[];
  rooms: Room[];
  users: User[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SystemSetting[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export class LocalStoreDataSource implements IDataSource {
  private data: DatabaseFile | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.data) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        this.isInitialized = true;
        return;
      } catch (err) {
        console.warn("Failed to parse local db.json, generating default seed...", err);
      }
    }

    // Generate initial seed data matching วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
    const defaultPasswordHash = bcrypt.hashSync("123456", 10);

    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(now);

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(tomorrow);

    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const dayAfterStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(dayAfter);

    this.data = {
      // 6 ห้องหลัก + อื่นๆ ตามใบคำขออนุญาตใช้ห้องประชุม วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
      rooms: [
        {
          roomId: "room_01",
          name: "หอประชุมอดิเรกสาร",
          building: "อาคารหอประชุมหลัก",
          floor: "ชั้น 1-2",
          capacity: 500,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#2563EB", // Royal Blue
          description:
            "หอประชุมขนาดใหญ่ รองรับพิธีการ สัมมนา กิจกรรมวิชาการระดับสถาบัน และการประชุมครู-บุคลากร",
          imageUrl:
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_02",
          name: "ห้องประชุมสักทอง",
          building: "อาคารเฉลิมพระเกียรติ",
          floor: "ชั้น 2",
          capacity: 60,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#D97706", // Amber / Warm Gold
          description:
            "ห้องประชุมระดับมาตรฐาน สำหรับการประชุมคณะกรรมการสถานศึกษา สัมมนาครู และประชุมฝ่ายวิชาการ",
          imageUrl:
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_03",
          name: "ห้องประชุมหน้าห้องผู้อำนวยการ",
          building: "อาคารอำนวยการ",
          floor: "ชั้น 2",
          capacity: 25,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#059669", // Emerald Green
          description:
            "ห้องประชุมผู้บริหาร รองรับการปรึกษาข้อราชการสำคัญ ต้อนรับผู้ทรงคุณวุฒิและคณะกรรมการภายนอก",
          imageUrl:
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_04",
          name: "ห้องประชุม (กาแฟ)",
          building: "อาคารวิทยบริการ",
          floor: "ชั้น 1",
          capacity: 15,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#E11D48", // Rose Red
          description:
            "ห้องประชุมบรรยากาศสบายๆ สำหรับการสนทนาแลกเปลี่ยนความคิดเห็นกลุ่มย่อยและต้อนรับแขกพิเศษ",
          imageUrl:
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_05",
          name: "อาคารโดมเอนกประสงค์",
          building: "อาคารกิจกรรมกลางแจ้ง",
          floor: "ลานกิจกรรมในร่ม",
          capacity: 1000,
          equipmentList: ["ระบบเสียง", "ไมโครโฟน", "อินเทอร์เน็ต"],
          isAvailable: true,
          color: "#0891B2", // Cyan / Ocean
          description:
            "ลานกิจกรรมในร่มขนาดใหญ่ สำหรับกิจกรรมหน้าเสาธง พิธีการ แข่งขันกีฬา และนิทรรศการสิ่งประดิษฐ์",
          imageUrl:
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_06",
          name: "ห้องคอมพิวเตอร์กลาง (ห้องโสต)",
          building: "อาคารศูนย์วิทยบริการและคอมพิวเตอร์",
          floor: "ชั้น 3",
          capacity: 45,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#7C3AED", // Violet
          description:
            "ห้องปฏิบัติการคอมพิวเตอร์พร้อมสื่อโสตทัศนูปกรณ์ครบครัน รองรับการสอบออนไลน์และการอบรมดิจิทัล",
          imageUrl:
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          roomId: "room_other",
          name: "อื่นๆ",
          building: "ระบุสถานที่ตามความประสงค์",
          floor: "-",
          capacity: 100,
          equipmentList: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          isAvailable: true,
          color: "#64748B", // Slate
          description:
            "สถานที่หรือห้องประชุมอื่นๆ ภายในวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ (โปรดระบุรายละเอียดเพิ่มเติม)",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],

      // เจ้าหน้าที่และผู้บริหาร 3 ระดับ + Admin + ครูผู้ขอจอง
      users: [
        {
          userId: "usr_admin",
          username: "admin",
          passwordHash: defaultPasswordHash,
          name: "ผู้ดูแลระบบดิจิทัล",
          prefix: "นาย",
          position: "นักวิชาการคอมพิวเตอร์",
          email: "admin@thaluang.ac.th",
          phoneNumber: "036-266-000",
          department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
          role: "Admin",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_inspector",
          username: "watcharapong",
          passwordHash: defaultPasswordHash,
          name: "นายวัชรพงศ์ โสภา",
          prefix: "นาย",
          position: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
          email: "watcharapong@thaluang.ac.th",
          phoneNumber: "081-456-7890",
          department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
          role: "Inspector", // เจ้าหน้าที่ผู้ตรวจสอบห้อง
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_endorser",
          username: "ekarat",
          passwordHash: defaultPasswordHash,
          name: "นายเอกราช เขียวทอง",
          prefix: "นาย",
          position: "หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร",
          email: "ekarat@thaluang.ac.th",
          phoneNumber: "089-123-4567",
          department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
          role: "Endorser", // หัวหน้างาน/ผู้รับรอง
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_approver",
          username: "chatree",
          passwordHash: defaultPasswordHash,
          name: "นายชาตรี เริงชัยภูมิ",
          prefix: "นาย",
          position: "รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
          email: "chatree@thaluang.ac.th",
          phoneNumber: "036-266-101",
          department: "ฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
          role: "Approver", // ผู้พิจารณา (อนุมัติ)
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_somchai",
          username: "somchai",
          passwordHash: defaultPasswordHash,
          name: "นายสมชาย ใจดี",
          prefix: "นาย",
          position: "ครู ชำนาญการพิเศษ",
          email: "somchai@thaluang.ac.th",
          phoneNumber: "086-778-9900",
          department: "แผนกวิชาช่างยนต์",
          role: "User",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_sudarat",
          username: "sudarat",
          passwordHash: defaultPasswordHash,
          name: "นางสุดารัตน์ รักเรียน",
          prefix: "นาง",
          position: "หัวหน้าแผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
          email: "sudarat@thaluang.ac.th",
          phoneNumber: "084-332-1144",
          department: "แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
          role: "User",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],

      // ตัวอย่างคำขอจองห้อง แสดงผลกระบวนการ 3 ขั้นตอน
      bookings: [
        {
          bookingId: "bk_thaluang_001",
          title: "ประชุมสัมมนาเตรียมความพร้อมการแข่งขันทักษะวิชาชีพ ประจำปีการศึกษา 2569",
          roomId: "room_01",
          roomName: "หอประชุมอดิเรกสาร",
          requesterPrefix: "นาย",
          bookedBy: "นายสมชาย ใจดี",
          position: "ครู ชำนาญการพิเศษ",
          department: "แผนกวิชาช่างยนต์",
          phoneNumber: "086-778-9900",
          bookedByEmail: "somchai@thaluang.ac.th",
          writtenDate: `${todayStr}`,
          date: todayStr,
          endDate: todayStr,
          startTime: "09:00",
          endTime: "12:00",
          startDateTime: `${todayStr}T09:00:00+07:00`,
          endDateTime: `${todayStr}T12:00:00+07:00`,
          attendeesCount: 150,
          purpose: "เพื่อเตรียมความพร้อมนักเรียนนักศึกษาและคณะกรรมการแข่งขันทักษะวิชาชีพ",
          equipment: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
            "โต๊ะ/เก้าอี้เพิ่มเติม",
          ],
          tableChairCount: 20,
          otherEquipment: "แท่นบรรยาย (โพเดียม) 1 ตัว",
          assetAgreementConfirmed: true,
          notes: "ต้องการเปิดเครื่องปรับอากาศล่วงหน้า 30 นาที",
          status: "Approved",

          // 3-Stage Tracking
          inspectionInspector: "นายวัชรพงศ์ โสภา",
          inspectionStatus: "ready",
          inspectionNote: "ตรวจสภาพห้อง ระบบภาพ แสง สี เสียง และเครื่องปรับอากาศพร้อมใช้งาน 100%",
          inspectionDate: `${todayStr} 08:30`,

          endorserName: "นายเอกราช เขียวทอง",
          endorsementStatus: "endorsed",
          endorsementNote: "เห็นควรอนุญาตตามที่ขอ",
          endorsementDate: `${todayStr} 08:45`,

          approvedBy: "นายชาตรี เริงชัยภูมิ",
          approvalStatus: "approved",
          approvedAt: new Date().toISOString(),

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          bookingId: "bk_thaluang_002",
          title: "ประชุมคณะกรรมการดำเนินงานจัดทำแผนปฏิบัติการประจำปี",
          roomId: "room_02",
          roomName: "ห้องประชุมสักทอง",
          requesterPrefix: "นาง",
          bookedBy: "นางสุดารัตน์ รักเรียน",
          position: "หัวหน้าแผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
          department: "แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
          phoneNumber: "084-332-1144",
          bookedByEmail: "sudarat@thaluang.ac.th",
          writtenDate: `${todayStr}`,
          date: todayStr,
          endDate: todayStr,
          startTime: "13:30",
          endTime: "16:30",
          startDateTime: `${todayStr}T13:30:00+07:00`,
          endDateTime: `${todayStr}T16:30:00+07:00`,
          attendeesCount: 35,
          purpose: "พิจารณาจัดสรรงบประมาณและโครงการพัฒนาทักษะวิชาชีพ",
          equipment: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          tableChairCount: 0,
          assetAgreementConfirmed: true,
          notes: "เตรียมสัญญาณ Wi-Fi สำหรับผู้เข้าประชุม 35 ท่าน",
          status: "Approved",

          inspectionInspector: "นายวัชรพงศ์ โสภา",
          inspectionStatus: "ready",
          inspectionNote: "พร้อมใช้งาน เรียบร้อย",
          inspectionDate: `${todayStr} 11:00`,

          endorserName: "นายเอกราช เขียวทอง",
          endorsementStatus: "endorsed",
          endorsementNote: "รับรองเรียบร้อย",
          endorsementDate: `${todayStr} 11:30`,

          approvedBy: "นายชาตรี เริงชัยภูมิ",
          approvalStatus: "approved",
          approvedAt: new Date().toISOString(),

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          bookingId: "bk_thaluang_003",
          title: "อบรมเชิงปฏิบัติการพัฒนาสื่อการสอนด้วยปัญญาประดิษฐ์ (AI)",
          roomId: "room_06",
          roomName: "ห้องคอมพิวเตอร์กลาง (ห้องโสต)",
          requesterPrefix: "นาย",
          bookedBy: "นายสมชาย ใจดี",
          position: "ครู ชำนาญการพิเศษ",
          department: "แผนกวิชาช่างยนต์",
          phoneNumber: "086-778-9900",
          bookedByEmail: "somchai@thaluang.ac.th",
          writtenDate: `${todayStr}`,
          date: tomorrowStr,
          endDate: tomorrowStr,
          startTime: "09:00",
          endTime: "16:00",
          startDateTime: `${tomorrowStr}T09:00:00+07:00`,
          endDateTime: `${tomorrowStr}T16:00:00+07:00`,
          attendeesCount: 40,
          purpose: "เพื่อพัฒนาสมรรถนะครูด้านการสร้างสื่อดิจิทัลและ AI ช่วยสอน",
          equipment: [
            "เครื่องฉายภาพ (Projector)",
            "ระบบเสียง",
            "ไมโครโฟน",
            "เครื่องปรับอากาศ",
            "อินเทอร์เน็ต",
          ],
          tableChairCount: 0,
          assetAgreementConfirmed: true,
          notes: "ขอความอนุเคราะห์ติดตั้งโปรแกรมและทดสอบเครื่องแม่ข่าย",
          status: "Pending", // รอการตรวจสอบ / อนุมัติ

          inspectionInspector: "นายวัชรพงศ์ โสภา",
          inspectionStatus: "ready",
          inspectionNote: "เครื่องคอมพิวเตอร์พร้อมใช้งาน 40 เครื่อง ระบบเน็ตความเร็วสูงปกติ",
          inspectionDate: `${todayStr} 16:00`,

          endorserName: "นายเอกราช เขียวทอง",
          endorsementStatus: "pending",

          approvedBy: "นายชาตรี เริงชัยภูมิ",
          approvalStatus: "pending",

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          bookingId: "bk_thaluang_004",
          title: "ประชุมผู้บริหารฝ่ายพัฒนายุทธศาสตร์และนโยบายวิทยาลัย",
          roomId: "room_03",
          roomName: "ห้องประชุมหน้าห้องผู้อำนวยการ",
          requesterPrefix: "นาย",
          bookedBy: "นายชาตรี เริงชัยภูมิ",
          position: "รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
          department: "ฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
          phoneNumber: "036-266-101",
          bookedByEmail: "chatree@thaluang.ac.th",
          writtenDate: `${todayStr}`,
          date: dayAfterStr,
          endDate: dayAfterStr,
          startTime: "10:00",
          endTime: "12:00",
          startDateTime: `${dayAfterStr}T10:00:00+07:00`,
          endDateTime: `${dayAfterStr}T12:00:00+07:00`,
          attendeesCount: 15,
          purpose: "ติดตามความก้าวหน้าโครงการประจำไตรมาส",
          equipment: ["ระบบเสียง", "เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
          assetAgreementConfirmed: true,
          status: "Approved",

          inspectionInspector: "นายวัชรพงศ์ โสภา",
          inspectionStatus: "ready",
          inspectionNote: "ห้องประชุมพร้อมใช้งาน",
          inspectionDate: `${todayStr} 15:00`,

          endorserName: "นายเอกราช เขียวทอง",
          endorsementStatus: "endorsed",
          endorsementDate: `${todayStr} 15:30`,

          approvedBy: "นายชาตรี เริงชัยภูมิ",
          approvalStatus: "approved",
          approvedAt: new Date().toISOString(),

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],

      notifications: [
        {
          notificationId: "notif_001",
          recipientUserId: "all_approvers",
          recipientRole: "Approver",
          title: "มีคำขอจองห้องประชุมใหม่รอพิจารณา",
          message: "นายสมชาย ใจดี ขอจองห้องคอมพิวเตอร์กลาง (ห้องโสต) วันที่ " + tomorrowStr,
          type: "booking_created",
          bookingId: "bk_thaluang_003",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],

      auditLogs: [
        {
          logId: "audit_init",
          timestamp: new Date().toISOString(),
          userId: "system",
          userName: "ระบบอัตโนมัติ",
          userRole: "System",
          action: "SYSTEM_INIT",
          entityType: "System",
          entityId: "system_core",
          details: "ติดตั้งระบบจองห้องประชุมออนไลน์ วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ เรียบร้อย",
        },
      ],

      settings: [
        {
          settingKey: "SYSTEM_TITLE",
          settingValue: "ระบบจองห้องประชุมออนไลน์ วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์",
          description: "ชื่อระบบที่แสดงบนหัวเว็บและเอกสารราชการ",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "COLLEGE_NAME",
          settingValue: "วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์",
          description: "ชื่อสถานศึกษาต้นสังกัด",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "DIGITAL_CENTER_ANNOUNCEMENT",
          settingValue:
            "งานศูนย์ดิจิทัลและสื่อสารองค์กร แจ้งเปิดให้บริการจองห้องประชุมออนไลน์ทุกห้องตามปกติ หากต้องการอุปกรณ์โสตทัศนูปกรณ์หรือระบบถ่ายทอดสดพิเศษ กรุณาประสานงานล่วงหน้าอย่างน้อย 2 วันทำการ",
          description: "ข้อความประกาศประชาสัมพันธ์จากงานศูนย์ดิจิทัลและสื่อสารองค์กร",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "WEBHOOK_URL",
          settingValue: "",
          description: "URL ปลายทางสำหรับส่งแจ้งเตือน Webhook (LINE Notify / Discord / Slack / API)",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "OFFICER_INSPECTOR",
          settingValue: "นายวัชรพงศ์ โสภา",
          description: "เจ้าหน้าที่ผู้ตรวจสอบห้อง (งานศูนย์ดิจิทัลและสื่อสารองค์กร)",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "OFFICER_ENDORSER",
          settingValue: "นายเอกราช เขียวทอง",
          description: "หัวหน้างาน/ผู้รับรอง (หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร)",
          updatedAt: new Date().toISOString(),
        },
        {
          settingKey: "OFFICER_APPROVER",
          settingValue: "นายชาตรี เริงชัยภูมิ",
          description: "ผู้พิจารณาอนุมัติ (รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน)",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    this.save();
    this.isInitialized = true;
  }

  private save(): void {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to local db.json:", err);
    }
  }

  // --- Bookings ---
  async getBookings(filter?: BookingFilter): Promise<{ bookings: Booking[]; total: number }> {
    await this.init();
    let list = [...(this.data?.bookings || [])];

    if (filter) {
      if (filter.roomId && filter.roomId !== "all") {
        list = list.filter((b) => b.roomId === filter.roomId);
      }
      if (filter.status && filter.status !== ("all" as any)) {
        list = list.filter((b) => b.status === filter.status);
      }
      if (filter.department && filter.department !== "all") {
        list = list.filter(
          (b) => b.department?.toLowerCase() === filter.department?.toLowerCase()
        );
      }
      if (filter.bookedByEmail) {
        list = list.filter((b) => b.bookedByEmail === filter.bookedByEmail);
      }
      if (filter.dateFrom) {
        list = list.filter((b) => b.date >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        list = list.filter((b) => b.date <= filter.dateTo!);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (b) =>
            b.title?.toLowerCase().includes(q) ||
            b.bookedBy?.toLowerCase().includes(q) ||
            b.roomName?.toLowerCase().includes(q) ||
            b.department?.toLowerCase().includes(q) ||
            b.purpose?.toLowerCase().includes(q)
        );
      }
    }

    // Sort descending by date and time
    list.sort((a, b) => b.startDateTime.localeCompare(a.startDateTime));

    const total = list.length;
    if (filter?.page && filter?.limit) {
      const start = (filter.page - 1) * filter.limit;
      list = list.slice(start, start + filter.limit);
    }

    return { bookings: list, total };
  }

  async getBookingById(id: string): Promise<Booking | null> {
    await this.init();
    return this.data?.bookings.find((b) => b.bookingId === id) || null;
  }

  async createBooking(booking: Booking): Promise<Booking> {
    await this.init();
    this.data!.bookings.unshift(booking);
    this.save();
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    await this.init();
    const idx = this.data!.bookings.findIndex((b) => b.bookingId === id);
    if (idx === -1) return null;

    this.data!.bookings[idx] = {
      ...this.data!.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data!.bookings[idx];
  }

  async deleteBooking(id: string): Promise<boolean> {
    await this.init();
    const beforeLen = this.data!.bookings.length;
    this.data!.bookings = this.data!.bookings.filter((b) => b.bookingId !== id);
    if (this.data!.bookings.length !== beforeLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Rooms ---
  async getRooms(includeUnavailable: boolean = false): Promise<Room[]> {
    await this.init();
    if (includeUnavailable) {
      return [...(this.data?.rooms || [])];
    }
    return (this.data?.rooms || []).filter((r) => r.isAvailable);
  }

  async getRoomById(id: string): Promise<Room | null> {
    await this.init();
    return this.data?.rooms.find((r) => r.roomId === id) || null;
  }

  async createRoom(room: Room): Promise<Room> {
    await this.init();
    this.data!.rooms.push(room);
    this.save();
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | null> {
    await this.init();
    const idx = this.data!.rooms.findIndex((r) => r.roomId === id);
    if (idx === -1) return null;

    this.data!.rooms[idx] = {
      ...this.data!.rooms[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data!.rooms[idx];
  }

  async deleteRoom(id: string): Promise<boolean> {
    await this.init();
    const idx = this.data!.rooms.findIndex((r) => r.roomId === id);
    if (idx === -1) return false;
    this.data!.rooms[idx].isAvailable = false;
    this.save();
    return true;
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    await this.init();
    return (this.data?.users || []).map((u) => {
      const { passwordHash, ...rest } = u;
      return rest as User;
    });
  }

  async getUserById(id: string): Promise<User | null> {
    await this.init();
    return this.data?.users.find((u) => u.userId === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    await this.init();
    return (
      this.data?.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      ) || null
    );
  }

  async createUser(user: User): Promise<User> {
    await this.init();
    this.data!.users.push(user);
    this.save();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.init();
    const idx = this.data!.users.findIndex((u) => u.userId === id);
    if (idx === -1) return null;

    this.data!.users[idx] = {
      ...this.data!.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data!.users[idx];
  }

  // --- Notifications ---
  async getNotifications(userId?: string): Promise<AppNotification[]> {
    await this.init();
    const notifs = this.data?.notifications || [];
    if (!userId) return notifs;

    return notifs.filter(
      (n) =>
        n.recipientUserId === userId ||
        n.recipientUserId === "all_approvers" ||
        n.recipientUserId === "all_admins"
    );
  }

  async createNotification(notification: AppNotification): Promise<AppNotification> {
    await this.init();
    this.data!.notifications.unshift(notification);
    this.save();
    return notification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    await this.init();
    const notif = this.data!.notifications.find((n) => n.notificationId === id);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  async markAllNotificationsRead(userId?: string): Promise<void> {
    await this.init();
    if (!this.data) return;
    this.data.notifications.forEach((n) => {
      if (
        !userId ||
        n.recipientUserId === userId ||
        n.recipientUserId === "all_approvers"
      ) {
        n.isRead = true;
      }
    });
    this.save();
  }

  // --- Audit Logs ---
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    await this.init();
    return (this.data?.auditLogs || []).slice(0, limit);
  }

  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    await this.init();
    this.data!.auditLogs.unshift(log);
    if (this.data!.auditLogs.length > 500) {
      this.data!.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // --- Settings ---
  async getSettings(): Promise<SystemSetting[]> {
    await this.init();
    return this.data?.settings || [];
  }

  async getSetting(key: string): Promise<string | null> {
    await this.init();
    const found = this.data?.settings.find((s) => s.settingKey === key);
    return found ? found.settingValue : null;
  }

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    await this.init();
    const idx = this.data!.settings.findIndex((s) => s.settingKey === key);
    const nowIso = new Date().toISOString();

    if (idx !== -1) {
      this.data!.settings[idx].settingValue = value;
      this.data!.settings[idx].updatedAt = nowIso;
      this.save();
      return this.data!.settings[idx];
    } else {
      const newSetting: SystemSetting = {
        settingKey: key,
        settingValue: value,
        description: "",
        updatedAt: nowIso,
      };
      this.data!.settings.push(newSetting);
      this.save();
      return newSetting;
    }
  }
}
