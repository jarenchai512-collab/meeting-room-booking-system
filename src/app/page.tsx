"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner message="กำลังเข้าสู่ระบบ..." />
    </div>
  );
}
