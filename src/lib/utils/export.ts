import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Booking } from "../data/types";
import { formatThaiDisplayDate } from "./date";

export function exportBookingsToCsv(bookings: Booking[], filename: string = "meeting_bookings.csv") {
  const headers = [
    "Booking ID",
    "หัวข้อการประชุม",
    "ห้องประชุม",
    "ผู้ขอจอง",
    "ตำแหน่ง",
    "หน่วยงาน/สาขาวิชา",
    "หมายเลขโทรศัพท์",
    "เขียนวันที่",
    "วันที่ใช้งาน",
    "ถึงวันที่",
    "เวลาเริ่ม",
    "เวลาสิ้นสุด",
    "จำนวนคน",
    "ครุภัณฑ์ที่ขอใช้",
    "โต๊ะเก้าอี้เพิ่มเติม (ตัว)",
    "อุปกรณ์อื่นๆ",
    "ผู้ตรวจห้อง (นายวัชรพงศ์ โสภา)",
    "ผู้รับรอง (นายเอกราช เขียวทอง)",
    "ผู้อนุมัติ (นายชาตรี เริงชัยภูมิ)",
    "สถานะรวม",
  ];

  const rows = bookings.map((b) => [
    b.bookingId,
    `"${(b.title || "").replace(/"/g, '""')}"`,
    `"${(b.roomName || "").replace(/"/g, '""')}"`,
    `"${(b.requesterPrefix ? `${b.requesterPrefix} ` : "") + (b.bookedBy || "").replace(/"/g, '""')}"`,
    `"${(b.position || "").replace(/"/g, '""')}"`,
    `"${(b.department || "").replace(/"/g, '""')}"`,
    `"${b.phoneNumber || ""}"`,
    `"${b.writtenDate || ""}"`,
    b.date,
    b.endDate || b.date,
    b.startTime,
    b.endTime,
    b.attendeesCount,
    `"${(b.equipment || []).join(", ").replace(/"/g, '""')}"`,
    b.tableChairCount || 0,
    `"${(b.otherEquipment || "").replace(/"/g, '""')}"`,
    `"${b.inspectionStatus === "ready" ? "พร้อมใช้งาน" : b.inspectionStatus === "not_ready" ? "ไม่พร้อมใช้งาน" : "รอตรวจ"}"`,
    `"${b.endorsementStatus === "endorsed" ? "รับรองแล้ว" : "รอรับรอง"}"`,
    `"${b.status === "Approved" ? "อนุมัติแล้ว" : b.status === "Rejected" ? "ไม่อนุมัติ" : "รออนุมัติ"}"`,
    b.status,
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBookingsToExcel(bookings: Booking[], filename: string = "meeting_bookings.xlsx") {
  const data = bookings.map((b) => ({
    "รหัสการจอง (Booking ID)": b.bookingId,
    "หัวข้อการประชุม / ดำเนินงาน": b.title,
    "ห้องประชุม": b.roomName,
    "ผู้ยื่นคำขอ": `${b.requesterPrefix ? `${b.requesterPrefix} ` : ""}${b.bookedBy}`,
    "ตำแหน่ง": b.position || "-",
    "หน่วยงาน / สาขาวิชา": b.department,
    "หมายเลขโทรศัพท์": b.phoneNumber || "-",
    "เขียนวันที่": b.writtenDate || "-",
    "วันที่เริ่ม": b.date,
    "ถึงวันที่": b.endDate || b.date,
    "เวลา": `${b.startTime} - ${b.endTime} น.`,
    "จำนวนคน (คน)": b.attendeesCount,
    "ครุภัณฑ์และสิ่งอำนวยความสะดวก": (b.equipment || []).join(", "),
    "โต๊ะ/เก้าอี้เพิ่มเติม (ตัว)": b.tableChairCount || 0,
    "อุปกรณ์อื่นๆ": b.otherEquipment || "-",
    "ผลการตรวจห้อง (นายวัชรพงศ์ โสภา)":
      b.inspectionStatus === "ready"
        ? "พร้อมใช้งาน"
        : b.inspectionStatus === "not_ready"
        ? "ไม่พร้อมใช้งาน"
        : "รอการตรวจ",
    "การรับรอง (นายเอกราช เขียวทอง)":
      b.endorsementStatus === "endorsed" ? "รับรองแล้ว" : "รอรับรอง",
    "การพิจารณา (นายชาตรี เริงชัยภูมิ)":
      b.status === "Approved" ? "อนุมัติแล้ว" : b.status === "Rejected" ? "ไม่อนุมัติ" : "รอพิจารณา",
    "สถานะภาพรวม": b.status,
    "วันที่ส่งคำขอ": b.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ข้อมูลการจองห้องประชุม");
  XLSX.writeFile(workbook, filename);
}

export function exportBookingsToPdf(bookings: Booking[], title: string = "รายงานการจองห้องประชุม") {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(
    `วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ • พิมพ์เมื่อ: ${new Date().toLocaleString("th-TH")}`,
    14,
    22
  );

  const head = [
    ["ID", "หัวข้อ", "ห้องประชุม", "ผู้ขอ", "แผนกวิชา", "วันที่", "เวลา", "จำนวน", "สถานะ"],
  ];

  const body = bookings.map((b) => [
    b.bookingId.substring(0, 12),
    (b.title || "").substring(0, 24),
    (b.roomName || "").substring(0, 18),
    b.bookedBy || "",
    (b.department || "").substring(0, 16),
    b.date,
    `${b.startTime}-${b.endTime}`,
    String(b.attendeesCount),
    b.status,
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: { fontSize: 8 },
  });

  doc.save("booking_report.pdf");
}
