"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookingRequestPrintDoc } from "@/components/print/BookingRequestPrintDoc";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Booking } from "@/lib/data/types";

export default function BookingPrintPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
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
          กลับหน้ารายการการจอง
        </button>
      </div>
    );
  }

  return <BookingRequestPrintDoc booking={booking} onBack={() => router.back()} />;
}
