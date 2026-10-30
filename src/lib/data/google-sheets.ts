import { sheets as googleSheets, sheets_v4 } from "@googleapis/sheets";
import { JWT } from "google-auth-library";
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

export class GoogleSheetsDataSource implements IDataSource {
  private sheetId: string;
  private clientEmail: string;
  private privateKey: string;
  private sheetsClient: sheets_v4.Sheets | null = null;
  private isInitialized = false;

  constructor(sheetId: string, clientEmail: string, privateKey: string) {
    this.sheetId = sheetId;
    this.clientEmail = clientEmail;
    // Replace escaped newlines if passed via environment variables
    this.privateKey = privateKey.replace(/\\n/g, "\n");
  }

  private getClient(): sheets_v4.Sheets {
    if (this.sheetsClient) return this.sheetsClient;

    const auth = new JWT({
      email: this.clientEmail,
      key: this.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheetsClient = googleSheets({ version: "v4", auth });
    return this.sheetsClient;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    const client = this.getClient();
    // Test metadata call to verify connection and permissions
    await client.spreadsheets.get({
      spreadsheetId: this.sheetId,
    });
    this.isInitialized = true;
  }

  async checkHealth(): Promise<{ ok: boolean; provider: "google_sheets"; details?: string }> {
    try {
      const client = this.getClient();
      const meta = await client.spreadsheets.get({
        spreadsheetId: this.sheetId,
      });
      const sheetNames = meta.data.sheets?.map((s) => s.properties?.title).join(", ");
      return {
        ok: true,
        provider: "google_sheets",
        details: `Connected to Google Spreadsheet "${meta.data.properties?.title}". Worksheets: ${sheetNames}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: "google_sheets",
        details: err?.message || "Failed to connect to Google Sheets",
      };
    }
  }

  /**
   * Helper: Read all rows from a sheet as key-value objects
   */
  private async readSheet(sheetName: string): Promise<{ headers: string[]; rows: any[]; rawRows: any[][] }> {
    const client = this.getClient();
    const res = await client.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `${sheetName}!A1:AZ`,
    });

    const values = res.data.values || [];
    if (values.length === 0) {
      return { headers: [], rows: [], rawRows: [] };
    }

    const headers = values[0].map((h: string) => h.trim());
    const rows = values.slice(1).map((row, index) => {
      const obj: any = { _rowIndex: index + 2 }; // Row index in 1-based Google Sheet (row 1 is header)
      headers.forEach((header, colIndex) => {
        obj[header] = row[colIndex] !== undefined ? row[colIndex] : "";
      });
      return obj;
    });

    return { headers, rows, rawRows: values };
  }

  // --- Bookings ---
  async getBookings(filter?: BookingFilter): Promise<{ bookings: Booking[]; total: number }> {
    const { rows } = await this.readSheet("Bookings");

    let bookings: Booking[] = rows.map((r) => {
      let equipment: string[] = [];
      try {
        if (r.equipment) equipment = JSON.parse(r.equipment);
      } catch {
        equipment = r.equipment ? [r.equipment] : [];
      }

      return {
        bookingId: r.bookingId,
        title: r.title,
        roomId: r.roomId,
        roomName: r.roomName,
        bookedBy: r.bookedBy,
        bookedByEmail: r.bookedByEmail,
        department: r.department,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        startDateTime: r.startDateTime,
        endDateTime: r.endDateTime,
        attendeesCount: Number(r.attendeesCount) || 1,
        purpose: r.purpose,
        equipment,
        notes: r.notes || "",
        fileAttachmentUrl: r.fileAttachmentUrl || "",
        fileAttachmentId: r.fileAttachmentId || "",
        fileName: r.fileName || "",
        status: r.status || "Pending",
        rejectionReason: r.rejectionReason || "",
        requesterPrefix: r.requesterPrefix || "",
        position: r.position || "",
        phoneNumber: r.phoneNumber || "",
        writtenDate: r.writtenDate || "",
        otherRoomDetail: r.otherRoomDetail || "",
        tableChairCount: r.tableChairCount ? Number(r.tableChairCount) : undefined,
        otherEquipment: r.otherEquipment || "",
        assetAgreementConfirmed: r.assetAgreementConfirmed === "true" || r.assetAgreementConfirmed === true,
        inspectionInspector: r.inspectionInspector || "",
        inspectionStatus: r.inspectionStatus || "pending",
        inspectionNote: r.inspectionNote || "",
        inspectionDate: r.inspectionDate || "",
        endorserName: r.endorserName || "",
        endorsementStatus: r.endorsementStatus || "pending",
        endorsementNote: r.endorsementNote || "",
        endorsementDate: r.endorsementDate || "",
        approvedBy: r.approvedBy || "",
        approvalStatus: r.approvalStatus || (r.status === "Approved" ? "approved" : r.status === "Rejected" ? "rejected" : "pending"),
        approvedAt: r.approvedAt || "",
        idempotencyKey: r.idempotencyKey || "",
        createdAt: r.createdAt || "",
        updatedAt: r.updatedAt || "",
      };
    });

    if (filter) {
      if (filter.status && filter.status !== "all") {
        bookings = bookings.filter((b) => b.status === filter.status);
      }
      if (filter.roomId) {
        bookings = bookings.filter((b) => b.roomId === filter.roomId);
      }
      if (filter.department) {
        bookings = bookings.filter(
          (b) => b.department?.toLowerCase() === filter.department?.toLowerCase()
        );
      }
      if (filter.bookedByEmail) {
        bookings = bookings.filter((b) => b.bookedByEmail === filter.bookedByEmail);
      }
      if (filter.dateFrom) {
        bookings = bookings.filter((b) => b.date >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        bookings = bookings.filter((b) => b.date <= filter.dateTo!);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        bookings = bookings.filter(
          (b) =>
            b.title?.toLowerCase().includes(q) ||
            b.bookedBy?.toLowerCase().includes(q) ||
            b.roomName?.toLowerCase().includes(q)
        );
      }
    }

    // Sort descending by startDateTime
    bookings.sort((a, b) => b.startDateTime.localeCompare(a.startDateTime));

    const total = bookings.length;
    if (filter?.page && filter?.limit) {
      const start = (filter.page - 1) * filter.limit;
      bookings = bookings.slice(start, start + filter.limit);
    }

    return { bookings, total };
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const { bookings } = await this.getBookings();
    return bookings.find((b) => b.bookingId === id) || null;
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const client = this.getClient();
    const rowValues = [
      booking.bookingId,
      booking.title,
      booking.roomId,
      booking.roomName,
      booking.bookedBy,
      booking.bookedByEmail,
      booking.department,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.startDateTime,
      booking.endDateTime,
      booking.attendeesCount,
      booking.purpose,
      JSON.stringify(booking.equipment || []),
      booking.notes || "",
      booking.fileAttachmentUrl || "",
      booking.fileAttachmentId || "",
      booking.fileName || "",
      booking.status,
      booking.rejectionReason || "",
      booking.approvedBy || "",
      booking.approvedAt || "",
      booking.idempotencyKey || "",
      booking.createdAt,
      booking.updatedAt,
      booking.requesterPrefix || "",
      booking.position || "",
      booking.phoneNumber || "",
      booking.writtenDate || "",
      booking.otherRoomDetail || "",
      booking.tableChairCount ?? "",
      booking.otherEquipment || "",
      booking.assetAgreementConfirmed ? "true" : "false",
      booking.inspectionInspector || "",
      booking.inspectionStatus || "pending",
      booking.inspectionNote || "",
      booking.inspectionDate || "",
      booking.endorserName || "",
      booking.endorsementStatus || "pending",
      booking.endorsementNote || "",
      booking.endorsementDate || "",
      booking.approvalStatus || "pending",
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: "Bookings!A:AZ",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    const { rows, headers } = await this.readSheet("Bookings");
    const target = rows.find((r) => r.bookingId === id);
    if (!target) return null;

    const rowIndex = target._rowIndex;
    const client = this.getClient();

    const merged = { ...target, ...updates, updatedAt: new Date().toISOString() };
    if (updates.equipment) {
      merged.equipment = JSON.stringify(updates.equipment);
    }

    const rowValues = headers.map((h) => (merged[h] !== undefined ? merged[h] : ""));

    await client.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `Bookings!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    return this.getBookingById(id);
  }

  async deleteBooking(id: string): Promise<boolean> {
    // For safety and audit trail, soft-delete as Cancelled
    const updated = await this.updateBooking(id, { status: "Cancelled" });
    return !!updated;
  }

  // --- Rooms ---
  async getRooms(includeUnavailable: boolean = false): Promise<Room[]> {
    const { rows } = await this.readSheet("Rooms");
    const rooms: Room[] = rows.map((r) => {
      let equipmentList: string[] = [];
      try {
        if (r.equipmentList) equipmentList = JSON.parse(r.equipmentList);
      } catch {
        equipmentList = r.equipmentList ? [r.equipmentList] : [];
      }

      return {
        roomId: r.roomId,
        name: r.name,
        building: r.building,
        floor: r.floor,
        capacity: Number(r.capacity) || 10,
        equipmentList,
        isAvailable: String(r.isAvailable).toUpperCase() === "TRUE",
        color: r.color || "#2563EB",
        description: r.description || "",
        imageUrl: r.imageUrl || "",
        createdAt: r.createdAt || "",
        updatedAt: r.updatedAt || "",
      };
    });

    if (includeUnavailable) return rooms;
    return rooms.filter((r) => r.isAvailable);
  }

  async getRoomById(id: string): Promise<Room | null> {
    const rooms = await this.getRooms(true);
    return rooms.find((r) => r.roomId === id) || null;
  }

  async createRoom(room: Room): Promise<Room> {
    const client = this.getClient();
    const rowValues = [
      room.roomId,
      room.name,
      room.building,
      room.floor,
      room.capacity,
      JSON.stringify(room.equipmentList || []),
      room.isAvailable ? "TRUE" : "FALSE",
      room.color,
      room.description,
      room.imageUrl || "",
      room.createdAt,
      room.updatedAt,
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: "Rooms!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | null> {
    const { rows, headers } = await this.readSheet("Rooms");
    const target = rows.find((r) => r.roomId === id);
    if (!target) return null;

    const rowIndex = target._rowIndex;
    const client = this.getClient();

    const merged = { ...target, ...updates, updatedAt: new Date().toISOString() };
    if (updates.equipmentList) {
      merged.equipmentList = JSON.stringify(updates.equipmentList);
    }
    if (updates.isAvailable !== undefined) {
      merged.isAvailable = updates.isAvailable ? "TRUE" : "FALSE";
    }

    const rowValues = headers.map((h) => (merged[h] !== undefined ? merged[h] : ""));

    await client.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `Rooms!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return this.getRoomById(id);
  }

  async deleteRoom(id: string): Promise<boolean> {
    const updated = await this.updateRoom(id, { isAvailable: false });
    return !!updated;
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const { rows } = await this.readSheet("Users");
    return rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      name: r.name,
      email: r.email,
      department: r.department,
      role: r.role,
      isActive: String(r.isActive).toUpperCase() === "TRUE",
      createdAt: r.createdAt || "",
      updatedAt: r.updatedAt || "",
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    const { rows } = await this.readSheet("Users");
    const r = rows.find((u) => u.userId === id);
    if (!r) return null;
    return {
      userId: r.userId,
      username: r.username,
      name: r.name,
      email: r.email,
      department: r.department,
      role: r.role,
      isActive: String(r.isActive).toUpperCase() === "TRUE",
      createdAt: r.createdAt || "",
      updatedAt: r.updatedAt || "",
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { rows } = await this.readSheet("Users");
    const r = rows.find((u) => u.username?.toLowerCase() === username.toLowerCase());
    if (!r) return null;
    return {
      userId: r.userId,
      username: r.username,
      passwordHash: r.passwordHash,
      name: r.name,
      email: r.email,
      department: r.department,
      role: r.role,
      isActive: String(r.isActive).toUpperCase() === "TRUE",
      createdAt: r.createdAt || "",
      updatedAt: r.updatedAt || "",
    };
  }

  async createUser(user: User): Promise<User> {
    const client = this.getClient();
    const rowValues = [
      user.userId,
      user.username,
      user.passwordHash || "",
      user.name,
      user.email,
      user.department,
      user.role,
      user.isActive ? "TRUE" : "FALSE",
      user.createdAt,
      user.updatedAt,
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: "Users!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { rows, headers } = await this.readSheet("Users");
    const target = rows.find((r) => r.userId === id);
    if (!target) return null;

    const rowIndex = target._rowIndex;
    const client = this.getClient();

    const merged = { ...target, ...updates, updatedAt: new Date().toISOString() };
    if (updates.isActive !== undefined) {
      merged.isActive = updates.isActive ? "TRUE" : "FALSE";
    }

    const rowValues = headers.map((h) => (merged[h] !== undefined ? merged[h] : ""));

    await client.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `Users!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return this.getUserById(id);
  }

  // --- Notifications ---
  async getNotifications(userId: string, role?: string): Promise<AppNotification[]> {
    const { rows } = await this.readSheet("Notifications");
    const notifs: AppNotification[] = rows.map((r) => ({
      notificationId: r.notificationId,
      recipientUserId: r.recipientUserId,
      recipientRole: r.recipientRole,
      title: r.title,
      message: r.message,
      type: r.type,
      bookingId: r.bookingId,
      isRead: String(r.isRead).toUpperCase() === "TRUE",
      createdAt: r.createdAt,
    }));

    return notifs
      .filter((n) => {
        if (n.recipientUserId === userId) return true;
        if (role === "Approver" && n.recipientUserId === "all_approvers") return true;
        if (role === "Admin" && (n.recipientUserId === "all_admins" || n.recipientUserId === "all_approvers")) return true;
        return false;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(notif: AppNotification): Promise<AppNotification> {
    const client = this.getClient();
    const rowValues = [
      notif.notificationId,
      notif.recipientUserId,
      notif.recipientRole || "",
      notif.title,
      notif.message,
      notif.type,
      notif.bookingId || "",
      notif.isRead ? "TRUE" : "FALSE",
      notif.createdAt,
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: "Notifications!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return notif;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const { rows, headers } = await this.readSheet("Notifications");
    const target = rows.find((r) => r.notificationId === id);
    if (!target) return false;

    const rowIndex = target._rowIndex;
    const client = this.getClient();
    const merged = { ...target, isRead: "TRUE" };
    const rowValues = headers.map((h) => (merged[h] !== undefined ? merged[h] : ""));

    await client.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `Notifications!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });

    return true;
  }

  // --- Audit Logs ---
  async createAuditLog(log: AuditLog): Promise<void> {
    const client = this.getClient();
    const rowValues = [
      log.logId,
      log.timestamp,
      log.userId,
      log.userName,
      log.userRole,
      log.action,
      log.entityType,
      log.entityId,
      log.details || "",
      log.ipAddress || "",
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: "AuditLogs!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    });
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const { rows } = await this.readSheet("AuditLogs");
    const logs: AuditLog[] = rows.map((r) => ({
      logId: r.logId,
      timestamp: r.timestamp,
      userId: r.userId,
      userName: r.userName,
      userRole: r.userRole,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: r.details,
      ipAddress: r.ipAddress,
    }));

    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return logs.slice(0, limit);
  }

  // --- Settings ---
  async getSettings(): Promise<SystemSetting[]> {
    const { rows } = await this.readSheet("Settings");
    return rows.map((r) => ({
      settingKey: r.settingKey,
      settingValue: r.settingValue,
      description: r.description || "",
      updatedAt: r.updatedAt || "",
    }));
  }

  async getSetting(key: string): Promise<string | null> {
    const settings = await this.getSettings();
    const item = settings.find((s) => s.settingKey === key);
    return item ? item.settingValue : null;
  }

  async updateSetting(key: string, value: string, description?: string): Promise<void> {
    const { rows, headers } = await this.readSheet("Settings");
    const target = rows.find((r) => r.settingKey === key);
    const client = this.getClient();

    if (target) {
      const rowIndex = target._rowIndex;
      const merged = {
        ...target,
        settingValue: value,
        description: description || target.description,
        updatedAt: new Date().toISOString(),
      };
      const rowValues = headers.map((h) => (merged[h] !== undefined ? merged[h] : ""));
      await client.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `Settings!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowValues] },
      });
    } else {
      await client.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: "Settings!A:Z",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              key,
              value,
              description || "",
              new Date().toISOString(),
            ],
          ],
        },
      });
    }
  }
}
