"use client";

import Link from "next/link";
import { MapIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // 추후 NextAuth.js Google OAuth 연동
    alert("Google 로그인 기능은 추후 구현 예정입니다.");
  };

  const handleAnonymousLogin = () => {
    // 추후 익명 로그인 구현
    alert("익명 로그인 기능은 추후 구현 예정입니다.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 브랜드 로고 */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-3 bg-blue-600 rounded-full">
              <MapIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ParkingTour</h1>
              <p className="text-sm text-gray-600">지도로 발견하는 새로운 장소들</p>
            </div>
          </Link>
        </div>

        {/* 로그인 카드 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-900">로그인</CardTitle>
            <CardDescription>ParkingTour에 오신 것을 환영합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google 로그인 버튼 */}
            <Button
              onClick={handleGoogleLogin}
              variant="primary"
              className="w-full flex items-center justify-center space-x-3 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google로 로그인</span>
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 익명 로그인 버튼 */}
            <Button onClick={handleAnonymousLogin} variant="secondary" className="w-full py-3">
              익명으로 둘러보기
            </Button>

            {/* 서비스 특징 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  익명 사용
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  실시간 정보
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  개인정보 보호
                </span>
              </div>
            </div>

            {/* 개인정보처리방침 */}
            <div className="text-center text-xs text-gray-500 mt-4">
              로그인하면{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                개인정보처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </div>
          </CardContent>
        </Card>

        {/* 홈으로 돌아가기 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
