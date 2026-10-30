"use client";

import { useEffect, useRef, useState } from "react";

export interface RealtimeEventPayload {
  type: string;
  data: any;
  timestamp: string;
}

export function useRealtimeEvents(onEvent?: (event: RealtimeEventPayload) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimer: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource("/api/events");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        const handleMessage = (type: string, e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const payload: RealtimeEventPayload = {
              type,
              data,
              timestamp: new Date().toISOString(),
            };
            setLastEvent(payload);
            if (callbackRef.current) {
              callbackRef.current(payload);
            }
          } catch (err) {
            console.error("Failed to parse SSE event data:", err);
          }
        };

        eventSource.addEventListener("connected", (e) => handleMessage("connected", e));
        eventSource.addEventListener("booking_created", (e) => handleMessage("booking_created", e));
        eventSource.addEventListener("booking_approved", (e) => handleMessage("booking_approved", e));
        eventSource.addEventListener("booking_rejected", (e) => handleMessage("booking_rejected", e));
        eventSource.addEventListener("booking_cancelled", (e) => handleMessage("booking_cancelled", e));
        eventSource.addEventListener("room_updated", (e) => handleMessage("room_updated", e));

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry after 5 seconds
          retryTimer = setTimeout(connect, 5000);
        };
      } catch (err) {
        setIsConnected(false);
        retryTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  return { isConnected, lastEvent };
}
