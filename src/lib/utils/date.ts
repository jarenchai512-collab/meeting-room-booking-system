/**
 * Date and Time utilities standardized on Asia/Bangkok (UTC+7)
 */

export const TIMEZONE = "Asia/Bangkok";

export function getNowInBangkok(): Date {
  return new Date();
}

/**
 * Format a Date to YYYY-MM-DD in Bangkok timezone
 */
export function formatBangkokDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Format a Date to HH:mm in Bangkok timezone
 */
export function formatBangkokTime(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Format date for display in Thai locale (e.g., 29 ต.ค. 2569)
 */
export function formatThaiDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00+07:00`);
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Combine Date (YYYY-MM-DD) and Time (HH:mm) into Bangkok ISO string (e.g. 2026-10-29T10:30:00+07:00)
 */
export function toBangkokIso(dateStr: string, timeStr: string): string {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${cleanTime}+07:00`;
}

/**
 * Convert Date/ISO to epoch milliseconds
 */
export function toEpochMs(isoOrDate: string): number {
  return new Date(isoOrDate).getTime();
}

/**
 * Pure Mathematical Overlap Check:
 * Range A [startA, endA) and Range B [startB, endB) overlap IF AND ONLY IF:
 * startA < endB AND endA > startB
 */
export function isTimeRangeOverlapping(
  startA: string, // ISO or epoch or HH:mm
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Validate that endTime is strictly after startTime
 */
export function isValidTimeInterval(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
}
