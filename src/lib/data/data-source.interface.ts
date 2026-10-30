import {
  Booking,
  Room,
  User,
  AppNotification,
  AuditLog,
  SystemSetting,
  BookingFilter,
} from "./types";

export interface IDataSource {
  // Initialization & Health
  init(): Promise<void>;
  checkHealth(): Promise<{ ok: boolean; provider: "google_sheets" | "local_store"; details?: string }>;

  // Bookings
  getBookings(filter?: BookingFilter): Promise<{ bookings: Booking[]; total: number }>;
  getBookingById(id: string): Promise<Booking | null>;
  createBooking(booking: Booking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null>;
  deleteBooking(id: string): Promise<boolean>;

  // Rooms
  getRooms(includeUnavailable?: boolean): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | null>;
  createRoom(room: Room): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | null>;
  deleteRoom(id: string): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;

  // Notifications
  getNotifications(userId: string, role?: string): Promise<AppNotification[]>;
  createNotification(notif: AppNotification): Promise<AppNotification>;
  markNotificationAsRead(id: string): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: AuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Settings
  getSettings(): Promise<SystemSetting[]>;
  getSetting(key: string): Promise<string | null>;
  updateSetting(key: string, value: string, description?: string): Promise<void>;
}
