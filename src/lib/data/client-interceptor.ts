/**
 * Client-side in-browser API interceptor for static hosting (GitHub Pages)
 * Simulates all backend endpoints (/api/*) directly in browser using localStorage
 * so the entire application functions 100% without needing a Node.js server.
 *
 * Updated: 3-stage approval, 6 official rooms, Inspector/Endorser roles
 */

const SEED_USERS = [
  {
    userId: "usr_admin",
    username: "admin",
    name: "ผู้ดูแลระบบ",
    email: "admin@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Admin",
    position: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    isActive: true,
  },
  {
    userId: "usr_watcharapong",
    username: "watcharapong",
    name: "นายวัชรพงศ์ โสภา",
    email: "watcharapong@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Inspector",
    position: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    isActive: true,
  },
  {
    userId: "usr_ekarat",
    username: "ekarat",
    name: "นายเอกราช เขียวทอง",
    email: "ekarat@thaluang.ac.th",
    department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
    role: "Endorser",
    position: "หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร",
    isActive: true,
  },
  {
    userId: "usr_chatree",
    username: "chatree",
    name: "นายชาตรี เริงชัยภูมิ",
    email: "chatree@thaluang.ac.th",
    department: "ฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
    role: "Approver",
    position: "รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
    isActive: true,
  },
  {
    userId: "usr_somchai",
    username: "somchai",
    name: "นายสมชาย ใจดี",
    email: "somchai@vtc.ac.th",
    department: "แผนกวิชาช่างยนต์",
    role: "User",
    position: "ครูผู้สอน",
    isActive: true,
  },
  {
    userId: "usr_sudarat",
    username: "sudarat",
    name: "นางสาวสุดารัตน์ แก้วใส",
    email: "sudarat@vtc.ac.th",
    department: "แผนกวิชาการบัญชี",
    role: "User",
    position: "ครูผู้สอน",
    isActive: true,
  },
];

const SEED_ROOMS = [
  {
    roomId: "room_01",
    name: "หอประชุมอดิเรกสาร",
    building: "อาคารอดิเรกสาร",
    floor: "ชั้น 1",
    capacity: 200,
    equipmentList: ["เครื่องฉายภาพ", "ระบบเสียง", "ไมโครโฟน", "เครื่องปรับอากาศ"],
    isAvailable: true,
    color: "#2563EB",
    description: "หอประชุมขนาดใหญ่ จุผู้เข้าร่วมได้ 200 ท่าน",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    roomId: "room_02",
    name: "ห้องประชุมสักทอง",
    building: "อาคารอำนวยการ",
    floor: "ชั้น 2",
    capacity: 50,
    equipmentList: ["เครื่องฉายภาพ", "ระบบเสียง", "ไมโครโฟน", "เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
    isAvailable: true,
    color: "#059669",
    description: "ห้องประชุมขนาดกลาง สำหรับการประชุมคณะกรรมการและงานสัมมนา",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    roomId: "room_03",
    name: "ห้องประชุมหน้าห้องผู้อำนวยการ",
    building: "อาคารอำนวยการ",
    floor: "ชั้น 2",
    capacity: 15,
    equipmentList: ["เครื่องฉายภาพ", "เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
    isAvailable: true,
    color: "#D97706",
    description: "ห้องประชุมผู้บริหาร สำหรับการประชุมกลุ่มย่อย",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    roomId: "room_04",
    name: "ห้องประชุม(กาแฟ)",
    building: "อาคารอำนวยการ",
    floor: "ชั้น 1",
    capacity: 20,
    equipmentList: ["เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
    isAvailable: true,
    color: "#7C3AED",
    description: "ห้องประชุมสบายๆ สำหรับการประชุมทีมและ Brainstorming",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    roomId: "room_05",
    name: "อาคารโดมเอนกประสงค์",
    building: "อาคารโดม",
    floor: "ชั้น 1",
    capacity: 500,
    equipmentList: ["ระบบเสียง", "ไมโครโฟน"],
    isAvailable: true,
    color: "#0891B2",
    description: "อาคารเอนกประสงค์ สำหรับงานพิธีการและกิจกรรมขนาดใหญ่",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    roomId: "room_06",
    name: "ห้องคอมพิวเตอร์กลาง(ห้องโสต)",
    building: "อาคารเทคโนโลยีสารสนเทศ",
    floor: "ชั้น 2",
    capacity: 40,
    equipmentList: ["เครื่องฉายภาพ", "ระบบเสียง", "เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
    isAvailable: true,
    color: "#E11D48",
    description: "ห้องคอมพิวเตอร์กลาง/ห้องโสตทัศนศึกษา พร้อมระบบมัลติมีเดีย",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function initLocalStorage() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem("mrbs_rooms")) {
    localStorage.setItem("mrbs_rooms", JSON.stringify(SEED_ROOMS));
  }

  if (!localStorage.getItem("mrbs_users")) {
    localStorage.setItem("mrbs_users", JSON.stringify(SEED_USERS));
  }

  if (!localStorage.getItem("mrbs_bookings")) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
    const initialBookings = [
      {
        bookingId: "bk_demo_001",
        title: "ประชุมแผนกวิชาช่างยนต์ประจำสัปดาห์",
        roomId: "room_02",
        roomName: "ห้องประชุมสักทอง",
        requesterPrefix: "นาย",
        bookedBy: "นายสมชาย ใจดี",
        position: "ครูผู้สอน",
        bookedByEmail: "somchai@vtc.ac.th",
        department: "แผนกวิชาช่างยนต์",
        phoneNumber: "0812345678",
        date: today,
        startTime: "13:30",
        endTime: "15:30",
        startDateTime: `${today}T13:30:00+07:00`,
        endDateTime: `${today}T15:30:00+07:00`,
        attendeesCount: 18,
        purpose: "ประชุมหารือแนวทางการจัดการเรียนการสอนภาคปฏิบัติ",
        equipment: ["เครื่องฉายภาพ", "ไมโครโฟน", "เครื่องปรับอากาศ"],
        assetAgreementConfirmed: true,
        status: "Approved",
        inspectionStatus: "ready",
        inspectionInspector: "นายวัชรพงศ์ โสภา",
        inspectionDate: today,
        endorsementStatus: "endorsed",
        endorserName: "นายเอกราช เขียวทอง",
        endorsementDate: today,
        approvedBy: "นายชาตรี เริงชัยภูมิ",
        approvalStatus: "approved",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        bookingId: "bk_demo_002",
        title: "อบรมเชิงปฏิบัติการระบบดิจิทัลเพื่อการเรียนรู้",
        roomId: "room_06",
        roomName: "ห้องคอมพิวเตอร์กลาง(ห้องโสต)",
        requesterPrefix: "นาย",
        bookedBy: "ผู้ดูแลระบบ",
        position: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
        bookedByEmail: "admin@thaluang.ac.th",
        department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
        date: today,
        startTime: "09:00",
        endTime: "12:00",
        startDateTime: `${today}T09:00:00+07:00`,
        endDateTime: `${today}T12:00:00+07:00`,
        attendeesCount: 35,
        purpose: "อบรมการใช้งานระบบ Google Workspace for Education",
        equipment: ["เครื่องฉายภาพ", "ระบบเสียง", "เครื่องปรับอากาศ", "อินเทอร์เน็ต"],
        assetAgreementConfirmed: true,
        status: "Pending",
        inspectionStatus: "pending",
        endorsementStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("mrbs_bookings", JSON.stringify(initialBookings));
  }

  if (!localStorage.getItem("mrbs_settings")) {
    localStorage.setItem("mrbs_settings", JSON.stringify({
      COLLEGE_NAME: "วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์",
      DIGITAL_CENTER_ANNOUNCEMENT: "📢 ยินดีต้อนรับสู่ระบบจองห้องประชุมออนไลน์ วท.ท่าหลวง ฯ กรุณาจองล่วงหน้าอย่างน้อย 1 วัน",
      WEBHOOK_URL: "",
      OFFICER_INSPECTOR: "นายวัชรพงศ์ โสภา",
      OFFICER_ENDORSER: "นายเอกราช เขียวทอง",
      OFFICER_APPROVER: "นายชาตรี เริงชัยภูมิ",
    }));
  }

  if (!localStorage.getItem("mrbs_current_user")) {
    localStorage.setItem("mrbs_current_user", JSON.stringify(SEED_USERS[0]));
  }
}

export function setupClientInterceptor() {
  if (typeof window === "undefined") return;

  initLocalStorage();

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this is an API call
    if (urlString.includes("/api/")) {
      const url = new URL(urlString, window.location.origin);
      const pathname = url.pathname.replace(/^\/meeting-room-booking-system/, "");
      const method = (init?.method || "GET").toUpperCase();

      try {
        // --- AUTH ENDPOINTS ---
        if (pathname === "/api/auth/me") {
          const userStr = localStorage.getItem("mrbs_current_user");
          if (!userStr) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
          }
          return new Response(JSON.stringify({ user: JSON.parse(userStr) }), { status: 200 });
        }

        if (pathname === "/api/auth/login" && method === "POST") {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const users = JSON.parse(localStorage.getItem("mrbs_users") || "[]");
          const found = users.find(
            (u: any) => u.username.toLowerCase() === (body.username || "").toLowerCase()
          );

          if (found) {
            localStorage.setItem("mrbs_current_user", JSON.stringify(found));
            return new Response(
              JSON.stringify({ success: true, user: found, token: "mock_jwt_token" }),
              { status: 200 }
            );
          }
          return new Response(
            JSON.stringify({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }),
            { status: 401 }
          );
        }

        if (pathname === "/api/auth/logout" && method === "POST") {
          localStorage.removeItem("mrbs_current_user");
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // --- SETTINGS ENDPOINTS ---
        if (pathname === "/api/settings") {
          if (method === "GET") {
            const settings = JSON.parse(localStorage.getItem("mrbs_settings") || "{}");
            return new Response(JSON.stringify({ settings }), { status: 200 });
          }
          if (method === "POST") {
            const body = init?.body ? JSON.parse(init.body as string) : {};
            const current = JSON.parse(localStorage.getItem("mrbs_settings") || "{}");
            const merged = { ...current, ...body };
            localStorage.setItem("mrbs_settings", JSON.stringify(merged));
            return new Response(JSON.stringify({ success: true, settings: merged }), { status: 200 });
          }
        }

        // --- ROOMS ENDPOINTS ---
        if (pathname === "/api/rooms") {
          const rooms = JSON.parse(localStorage.getItem("mrbs_rooms") || "[]");
          if (method === "GET") {
            return new Response(JSON.stringify({ rooms }), { status: 200 });
          }
          if (method === "POST") {
            const body = init?.body ? JSON.parse(init.body as string) : {};
            const newRoom = {
              roomId: `room_${Date.now()}`,
              ...body,
              isAvailable: body.isAvailable !== false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            rooms.push(newRoom);
            localStorage.setItem("mrbs_rooms", JSON.stringify(rooms));
            return new Response(JSON.stringify({ success: true, room: newRoom }), { status: 201 });
          }
        }

        if (pathname.startsWith("/api/rooms/")) {
          const roomId = pathname.split("/")[3];
          const rooms = JSON.parse(localStorage.getItem("mrbs_rooms") || "[]");
          const idx = rooms.findIndex((r: any) => r.roomId === roomId);

          if (idx !== -1) {
            if (method === "PUT") {
              const body = init?.body ? JSON.parse(init.body as string) : {};
              rooms[idx] = { ...rooms[idx], ...body, updatedAt: new Date().toISOString() };
              localStorage.setItem("mrbs_rooms", JSON.stringify(rooms));
              return new Response(JSON.stringify({ success: true, room: rooms[idx] }), { status: 200 });
            }
            if (method === "DELETE") {
              rooms[idx].isAvailable = false;
              localStorage.setItem("mrbs_rooms", JSON.stringify(rooms));
              return new Response(JSON.stringify({ success: true }), { status: 200 });
            }
          }
        }

        // --- BOOKINGS ENDPOINTS ---
        if (pathname === "/api/bookings") {
          const bookings = JSON.parse(localStorage.getItem("mrbs_bookings") || "[]");

          if (method === "GET") {
            let filtered = [...bookings];
            const status = url.searchParams.get("status");
            const roomId = url.searchParams.get("roomId");
            const search = url.searchParams.get("search");

            if (status && status !== "all") {
              filtered = filtered.filter((b: any) => b.status === status);
            }
            if (roomId && roomId !== "all") {
              filtered = filtered.filter((b: any) => b.roomId === roomId);
            }
            if (search) {
              const q = search.toLowerCase();
              filtered = filtered.filter(
                (b: any) =>
                  b.title?.toLowerCase().includes(q) ||
                  b.bookedBy?.toLowerCase().includes(q) ||
                  b.roomName?.toLowerCase().includes(q) ||
                  b.department?.toLowerCase().includes(q)
              );
            }

            return new Response(
              JSON.stringify({ bookings: filtered, total: filtered.length, page: 1, limit: 100 }),
              { status: 200 }
            );
          }

          if (method === "POST") {
            const body = init?.body ? JSON.parse(init.body as string) : {};
            const rooms = JSON.parse(localStorage.getItem("mrbs_rooms") || "[]");
            const room = rooms.find((r: any) => r.roomId === body.roomId);

            // Double booking validation (Conflict Detection)
            const startIso = `${body.date}T${body.startTime}:00+07:00`;
            const endIso = `${body.date}T${body.endTime}:00+07:00`;

            const conflict = bookings.find((b: any) => {
              if (b.roomId !== body.roomId) return false;
              if (b.status === "Cancelled" || b.status === "Rejected") return false;
              if (b.date !== body.date) return false;
              const bStart = new Date(b.startDateTime).getTime();
              const bEnd = new Date(b.endDateTime).getTime();
              const nStart = new Date(startIso).getTime();
              const nEnd = new Date(endIso).getTime();
              return nStart < bEnd && nEnd > bStart;
            });

            if (conflict) {
              return new Response(
                JSON.stringify({
                  error: `ห้อง "${room?.name || 'นี้'}" ไม่ว่างในช่วงเวลา ${body.startTime} - ${body.endTime} น. เนื่องจากมีการจองหัวข้อ "${conflict.title}" อยู่แล้ว`,
                }),
                { status: 409 }
              );
            }

            // Validate asset agreement checkbox
            if (!body.assetAgreementConfirmed) {
              return new Response(
                JSON.stringify({ error: "กรุณายืนยันการดูแลรักษาทรัพย์สินก่อนส่งคำขอ" }),
                { status: 400 }
              );
            }

            const currentUser = JSON.parse(localStorage.getItem("mrbs_current_user") || "{}");

            const newBooking = {
              bookingId: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              title: body.title,
              roomId: body.roomId,
              roomName: room?.name || body.roomName || "ห้องประชุม",
              otherRoomDetail: body.otherRoomDetail,
              requesterPrefix: body.requesterPrefix || currentUser.prefix,
              bookedBy: currentUser.name || "ผู้ใช้งาน",
              position: body.position || currentUser.position,
              bookedByEmail: currentUser.email || "user@vtc.ac.th",
              department: body.department || currentUser.department,
              phoneNumber: body.phoneNumber || currentUser.phoneNumber,
              date: body.date,
              startTime: body.startTime,
              endTime: body.endTime,
              startDateTime: startIso,
              endDateTime: endIso,
              attendeesCount: Number(body.attendeesCount) || 1,
              purpose: body.purpose || "",
              equipment: body.equipment || [],
              tableChairCount: body.tableChairCount,
              otherEquipment: body.otherEquipment,
              notes: body.notes || "",
              assetAgreementConfirmed: true,
              status: "Pending",
              inspectionStatus: "pending",
              endorsementStatus: "pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            bookings.unshift(newBooking);
            localStorage.setItem("mrbs_bookings", JSON.stringify(bookings));

            return new Response(
              JSON.stringify({
                success: true,
                booking: newBooking,
                message: "ส่งคำขอจองห้องเรียบร้อย รอเจ้าหน้าที่ตรวจสอบห้อง",
              }),
              { status: 201 }
            );
          }
        }

        if (pathname.startsWith("/api/bookings/")) {
          const parts = pathname.split("/");
          const bookingId = parts[3];
          const bookings = JSON.parse(localStorage.getItem("mrbs_bookings") || "[]");
          const idx = bookings.findIndex((b: any) => b.bookingId === bookingId);

          // 3-stage status update endpoint
          if (parts[4] === "status" && method === "PATCH") {
            const body = init?.body ? JSON.parse(init.body as string) : {};
            const currentUser = JSON.parse(localStorage.getItem("mrbs_current_user") || "{}");
            if (idx !== -1) {
              const now = new Date().toISOString();

              // Stage 1: Inspection
              if (body.stage === "inspection" || body.inspectionStatus) {
                bookings[idx].inspectionInspector = currentUser.name || "นายวัชรพงศ์ โสภา";
                bookings[idx].inspectionStatus = body.inspectionStatus;
                bookings[idx].inspectionNote = body.inspectionNote || "ห้องพร้อมใช้งาน";
                bookings[idx].inspectionDate = now;
                bookings[idx].status = body.inspectionStatus === "ready" ? "Inspected" : "Rejected";
              }
              // Stage 2: Endorsement
              else if (body.stage === "endorsement" || body.endorsementStatus) {
                bookings[idx].endorserName = currentUser.name || "นายเอกราช เขียวทอง";
                bookings[idx].endorsementStatus = body.endorsementStatus;
                bookings[idx].endorsementNote = body.endorsementNote || "เห็นควรอนุญาต";
                bookings[idx].endorsementDate = now;
                bookings[idx].status = body.endorsementStatus === "endorsed" ? "Endorsed" : "Rejected";
              }
              // Stage 3: Final approval
              else {
                bookings[idx].status = body.status || "Approved";
                bookings[idx].approvedBy = currentUser.name || "นายชาตรี เริงชัยภูมิ";
                bookings[idx].approvalStatus = body.status === "Approved" ? "approved" : "rejected";
                bookings[idx].approvedAt = now;
                if (body.rejectionReason) {
                  bookings[idx].rejectionReason = body.rejectionReason;
                }
              }

              bookings[idx].updatedAt = now;
              localStorage.setItem("mrbs_bookings", JSON.stringify(bookings));
              return new Response(
                JSON.stringify({ success: true, booking: bookings[idx], message: "อัปเดตสถานะเรียบร้อย" }),
                { status: 200 }
              );
            }
          }

          if (idx !== -1) {
            if (method === "GET") {
              return new Response(JSON.stringify({ booking: bookings[idx] }), { status: 200 });
            }
            if (method === "DELETE") {
              bookings[idx].status = "Cancelled";
              bookings[idx].updatedAt = new Date().toISOString();
              localStorage.setItem("mrbs_bookings", JSON.stringify(bookings));
              return new Response(JSON.stringify({ success: true, message: "ยกเลิกการจองเรียบร้อยแล้ว" }), { status: 200 });
            }
          }
        }

        // --- REPORTS ENDPOINT ---
        if (pathname === "/api/reports") {
          const bookings = JSON.parse(localStorage.getItem("mrbs_bookings") || "[]");
          const rooms = JSON.parse(localStorage.getItem("mrbs_rooms") || "[]");

          const total = bookings.length;
          const approved = bookings.filter((b: any) => b.status === "Approved").length;
          const pending = bookings.filter((b: any) => b.status === "Pending" || b.status === "Inspected" || b.status === "Endorsed").length;
          const rejected = bookings.filter((b: any) => b.status === "Rejected").length;
          const cancelled = bookings.filter((b: any) => b.status === "Cancelled").length;

          const roomStats = rooms.map((r: any) => {
            const roomBookings = bookings.filter((b: any) => b.roomId === r.roomId && b.status === "Approved");
            return {
              roomId: r.roomId,
              name: r.name,
              color: r.color,
              bookings: roomBookings.length,
            };
          });

          // Dynamic department stats
          const deptMap = new Map<string, number>();
          bookings.forEach((b: any) => {
            deptMap.set(b.department, (deptMap.get(b.department) || 0) + 1);
          });
          const departmentStats = Array.from(deptMap.entries())
            .map(([department, count]) => ({ department, count }))
            .sort((a, b) => b.count - a.count);

          return new Response(
            JSON.stringify({
              summary: {
                total,
                approved,
                pending,
                rejected,
                cancelled,
                approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
              },
              roomStats,
              departmentStats,
              dailyTrends: [
                { date: "2026-10-25", bookings: 2, approved: 2 },
                { date: "2026-10-26", bookings: 4, approved: 3 },
                { date: "2026-10-27", bookings: 3, approved: 3 },
                { date: "2026-10-28", bookings: 5, approved: 4 },
                { date: "2026-10-29", bookings: 6, approved: 5 },
                { date: "2026-10-30", bookings: 4, approved: 4 },
                { date: "2026-10-31", bookings: 3, approved: 2 },
              ],
            }),
            { status: 200 }
          );
        }

        // --- NOTIFICATIONS & AUDIT ---
        if (pathname === "/api/notifications") {
          return new Response(
            JSON.stringify({
              notifications: [
                {
                  notificationId: "notif_1",
                  title: "ระบบพร้อมใช้งาน",
                  message: "ระบบจองห้องประชุมออนไลน์ วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ พร้อมให้บริการ",
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
              ],
              unreadCount: 1,
            }),
            { status: 200 }
          );
        }

        if (pathname === "/api/system/health") {
          return new Response(
            JSON.stringify({
              status: "healthy",
              database: { ok: true, provider: "local_store" },
            }),
            { status: 200 }
          );
        }

        if (pathname === "/api/audit-logs") {
          return new Response(
            JSON.stringify({
              logs: [
                {
                  logId: "log_init",
                  timestamp: new Date().toISOString(),
                  userName: "ระบบอัตโนมัติ",
                  userRole: "System",
                  action: "SYSTEM_INIT",
                  entityType: "System",
                  details: "ระบบเริ่มต้นทำงานในโหมด Client Storage เรียบร้อย",
                },
              ],
            }),
            { status: 200 }
          );
        }
      } catch (err: any) {
        console.error("Client mock error:", err);
      }
    }

    // Fallback to original fetch
    return originalFetch.apply(this, [input as any, init]);
  };
}
