"use client";

import type React from "react";
import { useState } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNavigation } from "@/components/layout/MainNavigation";
import { MobileOptimized } from "@/components/layout";
import { SearchModal } from "@/components/search";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexWrapper } from "@/lib/convexClient";

const _inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: 1,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleOpenSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  const AppShell = (
    <>
      <MainNavigation 
        onSearchClick={handleOpenSearchModal} 
      />
      <div className="flex">
        {/* 왼쪽 사이드바 영역 */}
        <div className={`transition-all duration-300 ${isSearchModalOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <SearchModal isOpen={isSearchModalOpen} onClose={handleCloseSearchModal} />
        </div>
        
        {/* 메인 콘텐츠 영역 (지도) */}
        <div className={`transition-all duration-300 ${isSearchModalOpen ? 'w-[calc(100%-320px)]' : 'w-full'}`}>
          <MobileOptimized>
            <main className="pt-16">{children}</main>
          </MobileOptimized>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </>
  );

  return (
    <html lang="ko">
      <body className="antialiased">
        <ConvexWrapper>
          <QueryClientProvider client={queryClient}>
            {AppShell}
          </QueryClientProvider>
        </ConvexWrapper>
      </body>
    </html>
  );
}
