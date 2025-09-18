"use client";

import React from "react";
import { MobileBottomNavigation } from "./MainNavigation";

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

// 간단한 미디어 쿼리 훅
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export function MobileOptimized({ children, className = "" }: MobileOptimizedProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const combinedClassName = [
    "min-h-screen",
    isMobile ? "pb-20" : "pb-8", // 모바일에서 하단 네비게이션 공간 확보
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={combinedClassName}>
      {children}
      {isMobile && <MobileBottomNavigation />}
    </div>
  );
}
