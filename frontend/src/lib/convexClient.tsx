"use client";

import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { type ReactNode, useEffect, useState } from "react";

// Convex URL 설정
export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Convex 설정이 되어있는지 확인
export const isConvexConfigured = !!convexUrl;

// 안전한 Convex URL 생성
function createSafeConvexUrl(): string {
  if (!convexUrl) {
    console.warn('[ConvexClient] NEXT_PUBLIC_CONVEX_URL is not set');
    return 'https://placeholder.convex.cloud'; // 플레이스홀더 URL
  }
  return convexUrl;
}

// Convex 클라이언트 생성
export const convex = new ConvexReactClient(createSafeConvexUrl());

interface ConvexWrapperProps {
  children: ReactNode;
}

export function ConvexWrapper({ children }: ConvexWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    setIsClient(true);
    // 클라이언트에서 새로운 인스턴스 생성
    const client = new ConvexReactClient(createSafeConvexUrl());
    setConvexClient(client);
  }, []);

  // 서버 사이드에서는 children만 반환
  if (!isClient || !convexClient) {
    return <>{children}</>;
  }

  // 클라이언트 사이드에서만 ConvexProvider 렌더링 (인증 제거)
  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  );
}