import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthGate from "@/components/auth/AuthGate";
import { VerificationProvider } from "@/contexts/VerificationContext";
import dynamic from "next/dynamic";
const AppHeader = dynamic(() => import("@/components/layout/AppHeader"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Intern Bridge | Nhà tuyển dụng",
  description:
    "Intern Bridge - Hệ thống quản lý tuyển dụng và chăm sóc thực tập sinh toàn diện, hỗ trợ nhà tuyển dụng và ứng viên kết nối hiệu quả.",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <VerificationProvider>
          <AppHeader />
          <AuthGate>{children}</AuthGate>
          <Toaster />
          <Analytics />
        </VerificationProvider>
      </body>
    </html>
  );
}
