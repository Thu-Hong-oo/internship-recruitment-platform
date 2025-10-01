import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthGate from "@/components/auth/AuthGate";
import dynamic from "next/dynamic";
const AppHeader = dynamic(() => import("@/components/layout/AppHeader"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "InternBridge- Nhà tuyển dụng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AppHeader />
        <AuthGate>{children}</AuthGate>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
