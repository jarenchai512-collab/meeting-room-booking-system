"use client";

import React from "react";
import { Booking } from "@/lib/data/types";
import { Printer, Download, ArrowLeft, CheckCircle2 } from "lucide-react";

interface BookingRequestPrintDocProps {
  booking: Booking;
  onBack?: () => void;
}

export const BookingRequestPrintDoc: React.FC<BookingRequestPrintDocProps> = ({
  booking,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Format dates into Thai day, month, year
  const parseThaiDateParts = (dateStr?: string) => {
    if (!dateStr) return { day: "...", month: "...............", year: "........" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: "...", month: "...............", year: "........" };
      const thaiMonths = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];
      return {
        day: String(d.getDate()),
        month: thaiMonths[d.getMonth()],
        year: String(d.getFullYear() + 543),
      };
    } catch {
      return { day: "...", month: "...............", year: "........" };
    }
  };

  const writtenDateParts = parseThaiDateParts(booking.writtenDate || booking.date);
  const startDateParts = parseThaiDateParts(booking.date);
  const endDateParts = parseThaiDateParts(booking.endDate || booking.date);

  // Room selections
  const isRoom = (name: string) =>
    booking.roomName?.includes(name) ||
    (booking.roomId === "room_01" && name === "หอประชุมอดิเรกสาร") ||
    (booking.roomId === "room_02" && name === "ห้องประชุมสักทอง") ||
    (booking.roomId === "room_03" && name === "ห้องประชุมหน้าห้องผู้อำนวยการ") ||
    (booking.roomId === "room_04" && name === "ห้องประชุม (กาแฟ)") ||
    (booking.roomId === "room_05" && name === "อาคารโดมเอนกประสงค์") ||
    (booking.roomId === "room_06" && name === "ห้องคอมพิวเตอร์กลาง");

  const isOtherRoom =
    booking.roomId === "room_other" ||
    (!isRoom("หอประชุมอดิเรกสาร") &&
      !isRoom("ห้องประชุมสักทอง") &&
      !isRoom("ห้องประชุมหน้าห้องผู้อำนวยการ") &&
      !isRoom("ห้องประชุม (กาแฟ)") &&
      !isRoom("อาคารโดมเอนกประสงค์") &&
      !isRoom("ห้องคอมพิวเตอร์กลาง"));

  // Equipment selections
  const hasEq = (name: string) =>
    booking.equipment?.some((e) => e.toLowerCase().includes(name.toLowerCase()));

  const hasProjector = hasEq("ฉายภาพ") || hasEq("projector");
  const hasSound = hasEq("ระบบเสียง") || hasEq("เสียง");
  const hasMic = hasEq("ไมโครโฟน") || hasEq("ไมค์");
  const hasAir = hasEq("เครื่องปรับอากาศ") || hasEq("แอร์");
  const hasInternet = hasEq("อินเทอร์เน็ต") || hasEq("internet") || hasEq("wifi");
  const hasTableChair = (booking.tableChairCount && booking.tableChairCount > 0) || hasEq("โต๊ะ/เก้าอี้");
  const hasOtherEq = Boolean(booking.otherEquipment) || hasEq("อื่น");

  return (
    <div className="bg-slate-100 min-h-screen py-6 print:py-0 print:bg-white text-black">
      {/* Action Bar (hidden in print) */}
      <div className="max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={onBack || (() => window.history.back())}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-2">
            แบบฟอร์มขนาด A4 ตรงตามเอกสารราชการต้นฉบับ
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์แบบคำขอ (Print A4)</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto bg-white border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 print:w-full min-h-[297mm] p-10 sm:p-14 text-[13.5px] leading-relaxed font-serif">
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: "TH Sarabun New", "Sarabun", "Angsana New", Cordia, serif !important;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}</style>

        {/* College Seal Logo */}
        <div className="text-center mb-2">
          <div className="w-20 h-20 mx-auto flex items-center justify-center">
            {/* SVG Official Emblem representation of Thai Vocational Education / College */}
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              <polygon points="50,4 96,25 96,75 50,96 4,75 4,25" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
              <polygon points="50,12 88,30 88,70 50,88 12,70 12,30" fill="#FFFFFF" />
              <polygon points="50,18 82,34 82,66 50,82 18,66 18,34" fill="#2563EB" />
              {/* Inner Gear and Flame */}
              <circle cx="50" cy="50" r="20" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
              <circle cx="50" cy="50" r="14" fill="#DC2626" />
              <path d="M50 38 Q55 45 50 54 Q45 45 50 38 Z" fill="#FEF08A" />
              <path d="M47 52 L53 52 L50 62 Z" fill="#FEF08A" />
            </svg>
          </div>
          <h1 className="text-lg font-bold mt-2">แบบคำขออนุญาตใช้ห้องประชุม</h1>
          <h2 className="text-base font-bold">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</h2>
        </div>

        {/* Written Date */}
        <div className="text-right mt-3 mb-2">
          <span>เขียนวันที่ </span>
          <span className="font-semibold underline decoration-dotted underline-offset-4 px-2">
            {writtenDateParts.day} {writtenDateParts.month} พ.ศ. {writtenDateParts.year}
          </span>
        </div>

        {/* Subject & Salutation */}
        <div className="space-y-1 mb-3">
          <div>
            <span className="font-bold">เรื่อง</span>
            <span className="ml-4">ขออนุญาตใช้ห้องประชุม</span>
          </div>
          <div>
            <span className="font-bold">เรียน</span>
            <span className="ml-4">ผู้อำนวยการวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</span>
          </div>
        </div>

        {/* Requester Information */}
        <div className="space-y-1.5 leading-relaxed">
          <div className="flex flex-wrap items-baseline">
            <span className="indent-8">ข้าพเจ้า</span>
            <span className="mx-1 font-semibold underline decoration-dotted underline-offset-4 flex-1 min-w-[200px]">
              {booking.requesterPrefix ? `${booking.requesterPrefix} ` : ""}
              {booking.bookedBy || "......................................................................................."}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline">
            <span>ตำแหน่ง</span>
            <span className="mx-2 font-semibold underline decoration-dotted underline-offset-4 flex-1">
              {booking.position || "..............................................................................................................................."}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-y-1">
            <div className="flex items-baseline flex-1 min-w-[280px]">
              <span>หน่วยงาน / สาขาวิชา</span>
              <span className="mx-2 font-semibold underline decoration-dotted underline-offset-4 flex-1">
                {booking.department || "..............................................................."}
              </span>
            </div>
            <div className="flex items-baseline min-w-[200px]">
              <span>หมายเลขโทรศัพท์</span>
              <span className="mx-2 font-semibold underline decoration-dotted underline-offset-4 flex-1">
                {booking.phoneNumber || "......................................."}
              </span>
            </div>
          </div>
        </div>

        {/* Room Choices - 6 Main Rooms + Other */}
        <div className="mt-4">
          <div className="font-bold mb-2">มีความประสงค์ขออนุญาตใช้ห้องประชุม</div>
          <div className="grid grid-cols-3 gap-y-2 text-[12.5px] pl-4">
            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("หอประชุมอดิเรกสาร") ? "✓" : ""}
              </span>
              <span>หอประชุมอดิเรกสาร</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("ห้องประชุมสักทอง") ? "✓" : ""}
              </span>
              <span>ห้องประชุมสักทอง</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("ห้องประชุมหน้าห้องผู้อำนวยการ") ? "✓" : ""}
              </span>
              <span>ห้องประชุมหน้าห้องผู้อำนวยการ</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("ห้องประชุม (กาแฟ)") ? "✓" : ""}
              </span>
              <span>ห้องประชุม (กาแฟ)</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("อาคารโดมเอนกประสงค์") ? "✓" : ""}
              </span>
              <span>อาคารโดมเอนกประสงค์</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {isRoom("ห้องคอมพิวเตอร์กลาง") ? "✓" : ""}
              </span>
              <span>ห้องคอมพิวเตอร์กลาง (ห้องโสต)</span>
            </label>
          </div>

          <div className="mt-2 pl-4 flex items-baseline">
            <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold mr-2">
              {isOtherRoom ? "✓" : ""}
            </span>
            <span>อื่นๆ</span>
            <span className="mx-2 underline decoration-dotted underline-offset-4 flex-1">
              {isOtherRoom ? (booking.otherRoomDetail || booking.roomName) : "...................................................................................................................."}
            </span>
          </div>
        </div>

        {/* Purpose */}
        <div className="mt-3 flex flex-wrap items-baseline">
          <span>เพื่อใช้ในการดำเนินงาน เรื่อง</span>
          <span className="mx-2 font-semibold underline decoration-dotted underline-offset-4 flex-1">
            {booking.title || "........................................................................................................................................"}
          </span>
        </div>

        {/* Schedule & Attendees */}
        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span>กำหนดการใช้งานวันที่</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {startDateParts.day}
            </span>
            <span>เดือน</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {startDateParts.month}
            </span>
            <span>พ.ศ.</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {startDateParts.year}
            </span>
            <span>ถึงวันที่</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {endDateParts.day}
            </span>
            <span>เดือน</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {endDateParts.month}
            </span>
            <span>พ.ศ.</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-1">
              {endDateParts.year}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span>ตั้งแต่เวลา</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-2">
              {booking.startTime}
            </span>
            <span>น. ถึงเวลา</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-2">
              {booking.endTime}
            </span>
            <span>น. จำนวนผู้เข้าเข้าใช้ (โดยประมาณ)</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4 px-2">
              {booking.attendeesCount}
            </span>
            <span>คน</span>
          </div>
        </div>

        {/* Equipment & Facilities (6 items + table/chair + other) */}
        <div className="mt-4">
          <div className="font-bold mb-2">ครุภัณฑ์/อุปกรณ์/สิ่งอำนวยความสะดวกที่ขอใช้</div>
          <div className="grid grid-cols-3 gap-y-2 text-[12.5px] pl-4">
            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasProjector ? "✓" : ""}
              </span>
              <span>เครื่องฉายภาพ (Projector)</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasSound ? "✓" : ""}
              </span>
              <span>ระบบเสียง</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasMic ? "✓" : ""}
              </span>
              <span>ไมโครโฟน</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasAir ? "✓" : ""}
              </span>
              <span>เครื่องปรับอากาศ</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasInternet ? "✓" : ""}
              </span>
              <span>อินเทอร์เน็ต</span>
            </label>

            <label className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold">
                {hasTableChair ? "✓" : ""}
              </span>
              <span>
                โต๊ะ/เก้าอี้เพิ่มเติม{" "}
                <span className="underline decoration-dotted underline-offset-2 px-1 font-semibold">
                  {booking.tableChairCount ? booking.tableChairCount : "......"}
                </span>{" "}
                ตัว
              </span>
            </label>
          </div>

          <div className="mt-2 pl-4 flex items-baseline">
            <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-bold mr-2">
              {hasOtherEq ? "✓" : ""}
            </span>
            <span>อื่น ๆ</span>
            <span className="mx-2 underline decoration-dotted underline-offset-4 flex-1">
              {booking.otherEquipment || "...................................................................................................................."}
            </span>
          </div>
        </div>

        {/* Confirmation Guarantee Statement */}
        <div className="mt-4 indent-8 text-[13px] leading-relaxed">
          ข้าพเจ้าขอรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ และปฏิบัติตามระเบียบของวิทยาลัยโดยเคร่งครัด
        </div>

        {/* 4 Signature Boxes arranged in 2x2 table grid exactly like original */}
        <div className="mt-5 border border-black">
          <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
            {/* Box 1: ผู้ยื่นคำขอ */}
            <div className="p-3 text-center space-y-2">
              <p className="font-bold">ผู้ยื่นคำขอ</p>
              <div className="pt-6">
                <span>ลงชื่อ </span>
                <span className="underline decoration-dotted underline-offset-4 px-4 font-serif">
                  {booking.bookedBy || "........................................"}
                </span>
              </div>
              <div>
                (
                <span className="px-2 font-semibold">
                  {booking.requesterPrefix ? `${booking.requesterPrefix} ` : ""}
                  {booking.bookedBy}
                </span>
                )
              </div>
              <div>
                <span>วันที่ </span>
                <span className="underline decoration-dotted underline-offset-4 px-2">
                  {writtenDateParts.day} {writtenDateParts.month} พ.ศ. {writtenDateParts.year}
                </span>
              </div>
            </div>

            {/* Box 2: หัวหน้างาน/ผู้รับรอง */}
            <div className="p-3 text-center space-y-2">
              <p className="font-bold">หัวหน้างาน/ผู้รับรอง</p>
              <div className="pt-6">
                <span>ลงชื่อ </span>
                <span className="underline decoration-dotted underline-offset-4 px-4 font-serif">
                  {booking.endorsementStatus === "endorsed" ? "เอกราช เขียวทอง" : "........................................"}
                </span>
              </div>
              <div className="font-semibold">
                (นายเอกราช เขียวทอง)
              </div>
              <div className="text-[12px] text-slate-700">
                หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร
              </div>
              <div>
                <span>วันที่ </span>
                <span className="underline decoration-dotted underline-offset-4 px-2">
                  {booking.endorsementDate || "..............................................."}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-black">
            {/* Box 3: เจ้าหน้าที่ผู้ตรวจสอบห้อง */}
            <div className="p-3 text-center space-y-1.5">
              <p className="font-bold">เจ้าหน้าที่ผู้ตรวจสอบห้อง</p>
              <div className="pt-4">
                <span>ลงชื่อ </span>
                <span className="underline decoration-dotted underline-offset-4 px-4 font-serif">
                  {booking.inspectionStatus === "ready" ? "วัชรพงศ์ โสภา" : "........................................"}
                </span>
              </div>
              <div className="font-semibold">
                (นายวัชรพงศ์ โสภา)
              </div>
              <div className="text-[12px] text-slate-700">
                เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร
              </div>
              <div className="flex items-center justify-center gap-6 pt-1 text-[12.5px]">
                <label className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px]">
                    {booking.inspectionStatus === "ready" ? "✓" : ""}
                  </span>
                  <span>พร้อมใช้งาน</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px]">
                    {booking.inspectionStatus === "not_ready" ? "✓" : ""}
                  </span>
                  <span>ไม่พร้อมใช้งาน</span>
                </label>
              </div>
              <div className="text-left text-[11.5px] pt-1">
                <span>หมายเหตุ: </span>
                <span className="underline decoration-dotted underline-offset-2">
                  {booking.inspectionNote || "...................................................................."}
                </span>
              </div>
            </div>

            {/* Box 4: ผู้พิจารณา */}
            <div className="p-3 text-center space-y-2">
              <p className="font-bold">ผู้พิจารณา</p>
              <div className="pt-4">
                <span>ลงชื่อ </span>
                <span className="underline decoration-dotted underline-offset-4 px-4 font-serif">
                  {booking.status === "Approved" ? "ชาตรี เริงชัยภูมิ" : "........................................"}
                </span>
              </div>
              <div className="font-semibold">
                (นายชาตรี เริงชัยภูมิ)
              </div>
              <div className="text-[12px] text-slate-700">
                รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน
              </div>
              <div>
                <span>วันที่ </span>
                <span className="underline decoration-dotted underline-offset-4 px-2">
                  {booking.approvedAt
                    ? new Date(booking.approvedAt).toLocaleDateString("th-TH")
                    : "..............................................."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
