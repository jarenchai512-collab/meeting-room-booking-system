import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ClientInitializer } from "@/components/ClientInitializer";

export const metadata: Metadata = {
  title: "Meeting Room Booking System | ระบบจองห้องประชุมออนไลน์",
  description: "ระบบบริหารจัดการและจองห้องประชุมออนไลน์ เชื่อมต่อ Google Workspace (Sheets & Drive)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800">
        <ClientInitializer />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
