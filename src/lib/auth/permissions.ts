import { Booking, UserRole } from "../data/types";
import { TokenPayload } from "./jwt";

export function canManageRooms(role: UserRole): boolean {
  return role === "Admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "Admin";
}

export function canInspectRoom(role: UserRole): boolean {
  return role === "Admin" || role === "Inspector";
}

export function canEndorse(role: UserRole): boolean {
  return role === "Admin" || role === "Endorser" || role === "Approver";
}

export function canApproveOrReject(role: UserRole): boolean {
  return role === "Admin" || role === "Approver" || role === "Inspector" || role === "Endorser";
}

export function canViewAllBookingDetails(role: UserRole): boolean {
  return role === "Admin" || role === "Approver" || role === "Inspector" || role === "Endorser";
}

export function canModifyBooking(user: TokenPayload, booking: Booking): boolean {
  if (user.role === "Admin") return true;
  if (booking.bookedByEmail === user.email && booking.status === "Pending") {
    return true;
  }
  return false;
}

export function canCancelBooking(user: TokenPayload, booking: Booking): boolean {
  if (user.role === "Admin") return true;
  if (booking.bookedByEmail === user.email) {
    return booking.status === "Pending" || booking.status === "Approved" || booking.status === "Inspected" || booking.status === "Endorsed";
  }
  return false;
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === "Admin";
}

export function canManageSettings(role: UserRole): boolean {
  return role === "Admin";
}
