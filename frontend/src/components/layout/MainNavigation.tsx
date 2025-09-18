import type React from "react";
import Link from "next/link";
import {
  MapIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

interface NavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  onClick?: () => void;
}

function NavButton({ icon: Icon, label, href, onClick }: NavButtonProps) {
  return (
    <Link href={href} onClick={onClick}>
      <Button variant="ghost" size="sm" className="flex items-center space-x-1">
        <Icon className="h-5 w-5" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </Link>
  );
}

interface SearchButtonProps {
  onClick: () => void;
}

function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="flex items-center space-x-1"
      onClick={onClick}
    >
      <MagnifyingGlassIcon className="h-5 w-5" />
      <span className="hidden sm:inline">검색</span>
    </Button>
  );
}

function ParkingToggleButton() {
  return (
    <Link href="/parking">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center space-x-1"
      >
        <BuildingOfficeIcon className="h-5 w-5" />
        <span className="hidden sm:inline">주차장</span>
      </Button>
    </Link>
  );
}

function MapViewButton() {
  return (
    <Link href="/map">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center space-x-1"
      >
        <MapIcon className="h-5 w-5" />
        <span className="hidden sm:inline">전체지도</span>
      </Button>
    </Link>
  );
}

function NotificationButton() {
  return (
    <Button variant="ghost" size="sm" className="relative">
      <BellIcon className="h-5 w-5" />
      {/* 알림 배지 */}
      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
    </Button>
  );
}

function UserMenuButton() {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">사용자</span>
      </div>
    </div>
  );
}

export function MainNavigation({ 
  onSearchClick
}: { 
  onSearchClick?: () => void;
}) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 - 홈으로 이동 */}
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-all duration-200"
          >
            <MapIcon className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">ParkingTour</span>
          </Link>

          {/* 주요 액션 버튼들 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <SearchButton onClick={onSearchClick || (() => {})} />
            <ParkingToggleButton />
            <MapViewButton />
            <NotificationButton />
            <UserMenuButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

// 모바일 하단 네비게이션
export function MobileBottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden">
      <div className="flex justify-around items-center">
        <NavButton icon={MapIcon} label="지도" href="/" />
        <NavButton icon={MagnifyingGlassIcon} label="검색" href="/search" />
        <NavButton icon={BuildingOfficeIcon} label="주차장" href="/parking" />
        <NavButton icon={UserIcon} label="프로필" href="/profile" />
      </div>
    </div>
  );
}
