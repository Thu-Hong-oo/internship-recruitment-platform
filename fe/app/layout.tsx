import type React from "react";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

//auth provider quản lý auth state

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "InternBridge",
  description:
    "InternBridge - Website tuyển dụng thực tập sinh tích hợp AI phân tích hồ sơ và cá nhân hóa lộ trình phát triển kỹ năng dựa trên phân tích ngôn ngữ tự nhiên",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${dmSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
