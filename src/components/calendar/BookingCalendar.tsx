"use client";

import React, { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Booking, Room } from "@/lib/data/types";

interface BookingCalendarProps {
  bookings: Booking[];
  rooms: Room[];
  onSelectBooking: (bookingId: string) => void;
  onSelectDateSlot?: (slot: { date: string; startTime: string; endTime: string; roomId?: string }) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  rooms,
  onSelectBooking,
  onSelectDateSlot,
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Map bookings to FullCalendar event format
  const events = bookings
    .filter((b) => b.status !== "Cancelled" && b.status !== "Rejected")
    .map((b) => {
      const room = rooms.find((r) => r.roomId === b.roomId);
      const isApproved = b.status === "Approved";
      const roomColor = room?.color || "#2563EB";

      return {
        id: b.bookingId,
        title: `${b.roomName}: ${b.title}`,
        start: b.startDateTime,
        end: b.endDateTime,
        backgroundColor: isApproved ? roomColor : "#F59E0B",
        borderColor: isApproved ? roomColor : "#D97706",
        textColor: "#FFFFFF",
        extendedProps: {
          booking: b,
        },
      };
    });

  const handleEventClick = (info: any) => {
    onSelectBooking(info.event.id);
  };

  const handleDateSelect = (info: any) => {
    if (!onSelectDateSlot) return;

    // Extract start and end time
    const start = new Date(info.startStr);
    const end = new Date(info.endStr);

    const dateStr = info.startStr.split("T")[0];
    const startTimeStr = info.startStr.includes("T")
      ? info.startStr.substring(11, 16)
      : "09:00";
    const endTimeStr = info.endStr.includes("T")
      ? info.endStr.substring(11, 16)
      : "10:30";

    onSelectDateSlot({
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc-header-toolbar {
          margin-bottom: 1.25rem !important;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .fc-toolbar-title {
          font-size: 1.15rem !important;
          font-weight: 700 !important;
          color: #1e293b;
        }
        .fc-button-primary {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
          border-radius: 0.5rem !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          padding: 0.4rem 0.75rem !important;
        }
        .fc-button-primary:hover {
          background-color: #1d4ed8 !important;
        }
        .fc-button-active {
          background-color: #1e40af !important;
        }
        .fc-event {
          border-radius: 6px !important;
          padding: 2px 4px !important;
          cursor: pointer !important;
          font-size: 0.75rem !important;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        .fc-col-header-cell {
          background-color: #f8fafc;
          padding: 6px 0 !important;
          font-size: 0.8rem;
          color: #475569;
        }
        .fc-timegrid-slot {
          height: 2.2rem !important;
        }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "วันนี้",
          month: "รายเดือน",
          week: "รายสัปดาห์",
          day: "รายวัน",
        }}
        locale="th"
        timeZone="Asia/Bangkok"
        events={events}
        eventClick={handleEventClick}
        selectable={true}
        select={handleDateSelect}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
          hour12: false,
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        height="auto"
      />
    </div>
  );
};
