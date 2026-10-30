"use client";

import { useEffect } from "react";
import { setupClientInterceptor } from "@/lib/data/client-interceptor";

export function ClientInitializer() {
  useEffect(() => {
    // If running on GitHub Pages (github.io) or if backend API is not accessible,
    // install the client-side mock interceptor
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("github.io") ||
        process.env.NEXT_PUBLIC_CLIENT_MOCK === "true")
    ) {
      console.log("🚀 Enabling Client-side Storage for GitHub Pages environment");
      setupClientInterceptor();
    }
  }, []);

  return null;
}
