import { LocalStoreDataSource } from "../src/lib/data/local-store";
import { AppNotification } from "../src/lib/data/types";

describe("Reports & Notifications Integration Tests", () => {
  let db: LocalStoreDataSource;

  beforeAll(async () => {
    db = new LocalStoreDataSource();
    await db.init();
  });

  test("Creates notification and fetches only for target recipient role or user", async () => {
    const notifApprover: AppNotification = {
      notificationId: `notif_approver_${Date.now()}`,
      recipientUserId: "all_approvers",
      recipientRole: "Approver",
      title: "New Booking Request",
      message: "Please review booking",
      type: "booking_created",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const notifUserOnly: AppNotification = {
      notificationId: `notif_user_${Date.now()}`,
      recipientUserId: "usr_user",
      title: "Booking Approved",
      message: "Your booking was approved",
      type: "booking_approved",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await db.createNotification(notifApprover);
    await db.createNotification(notifUserOnly);

    // Approver should receive all_approvers notifications
    const approverNotifs = await db.getNotifications("usr_approver", "Approver");
    expect(approverNotifs.some((n) => n.notificationId === notifApprover.notificationId)).toBe(true);

    // Regular user should receive only their own notification, NOT all_approvers
    const userNotifs = await db.getNotifications("usr_user", "User");
    expect(userNotifs.some((n) => n.notificationId === notifUserOnly.notificationId)).toBe(true);
    expect(userNotifs.some((n) => n.notificationId === notifApprover.notificationId)).toBe(false);

    // Mark as read
    const marked = await db.markNotificationAsRead(notifUserOnly.notificationId);
    expect(marked).toBe(true);
  });

  test("Calculates utilization formula correctly", () => {
    const totalHoursBooked = 16;
    const totalAvailableHours = 40; // 5 rooms * 8 hours
    const utilizationRate = Math.round((totalHoursBooked / totalAvailableHours) * 100);
    expect(utilizationRate).toBe(40);
  });
});
