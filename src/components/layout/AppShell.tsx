"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { BookingDetailModal } from "../modals/BookingDetailModal";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const { isConnected } = useRealtimeEvents();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onOpenBookingModal={(id) => setSelectedBookingId(id)}
          isRealtimeConnected={isConnected}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}
    </div>
  );
};
