"use client";

import { ReactNode } from "react";//đại diện cho các thành phần của react có thể render
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

//typescript cần mô tả props của component nhận vào nên cần interface ( autocomplete, compile time error)
interface PageLayoutProps {
  children: ReactNode;
  showSearchBar?: boolean; //? có thể có hoặc không
  searchBarContent?: ReactNode;
}


export default function PageLayout({
  children,
  showSearchBar = false,
  searchBarContent,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {showSearchBar && searchBarContent && (
        <div className="gradient-hero text-white py-4">
          <div className="max-w-7xl mx-auto px-4">{searchBarContent}</div>
          {/* 7xl: max-width 80rem=1280px , căn giữa mx-auto*/}
        </div>
      )}

      <main>{children}</main>

      <Footer />
    </div>
  );
}
