"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookingRequestPrintDoc } from "@/components/print/BookingRequestPrintDoc";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Booking } from "@/lib/data/types";

function PrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch (err) {
        console.error("Print page fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (bookingId) {
      fetchBooking();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="กำลังเตรียมเอกสารแบบคำขออนุญาตใช้ห้องประชุม (A4)..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800">ไม่พบเอกสารการจองห้องประชุม</h2>
        <button
          onClick={() => router.push("/bookings")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          กลับหน้ารายการจอง
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen py-6 print:p-0 print:bg-white print:m-0">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => window.history.back()}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← ย้อนกลับ
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <span>🖨️ สั่งพิมพ์ A4</span>
          </button>
        </div>
      </div>

      <BookingRequestPrintDoc booking={booking} />
    </div>
  );
}

export default function BookingPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner message="กำลังเตรียมเอกสาร..." />
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
