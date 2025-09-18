"use client";

import type React from "react";
import { useState } from "react";
import { XMarkIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

// 주차장 데이터 타입 정의
interface ParkingLot {
  id: number;
  name: string;
  address: string;
  totalSpaces: number;
  availableSpaces: number;
  congestionLevel: 'available' | 'moderate' | 'crowded' | 'full';
  hourlyRate: number;
  facilities: string[];
  distance: number;
  rating: number;
}

interface ParkingInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

// 샘플 주차장 데이터
const sampleParkingLots: ParkingLot[] = [
  {
    id: 1,
    name: "명동 공영주차장",
    address: "서울특별시 중구 명동2가 54-1",
    totalSpaces: 150,
    availableSpaces: 45,
    congestionLevel: 'moderate',
    hourlyRate: 2000,
    facilities: ["실내주차", "24시간", "CCTV"],
    distance: 0.2,
    rating: 4.2
  },
  {
    id: 2,
    name: "롯데백화점 주차장",
    address: "서울특별시 중구 남대문로 81",
    totalSpaces: 300,
    availableSpaces: 12,
    congestionLevel: 'crowded',
    hourlyRate: 3000,
    facilities: ["실내주차", "발렛파킹", "전기차충전"],
    distance: 0.3,
    rating: 4.5
  },
  {
    id: 3,
    name: "신세계백화점 주차장",
    address: "서울특별시 중구 소공로 63",
    totalSpaces: 250,
    availableSpaces: 0,
    congestionLevel: 'full',
    hourlyRate: 2500,
    facilities: ["실내주차", "24시간", "세차서비스"],
    distance: 0.4,
    rating: 4.1
  },
  {
    id: 4,
    name: "남산 공영주차장",
    address: "서울특별시 중구 회현동1가 100-177",
    totalSpaces: 80,
    availableSpaces: 65,
    congestionLevel: 'available',
    hourlyRate: 1500,
    facilities: ["야외주차", "24시간"],
    distance: 0.8,
    rating: 3.8
  },
  {
    id: 5,
    name: "동대문 디자인플라자 주차장",
    address: "서울특별시 중구 을지로 281",
    totalSpaces: 400,
    availableSpaces: 120,
    congestionLevel: 'available',
    hourlyRate: 2200,
    facilities: ["실내주차", "24시간", "CCTV", "전기차충전"],
    distance: 1.2,
    rating: 4.3
  },
  {
    id: 6,
    name: "청계천 공영주차장",
    address: "서울특별시 중구 수표동 57",
    totalSpaces: 120,
    availableSpaces: 35,
    congestionLevel: 'moderate',
    hourlyRate: 1800,
    facilities: ["실내주차", "CCTV"],
    distance: 0.6,
    rating: 3.9
  },
  {
    id: 7,
    name: "을지로 지하주차장",
    address: "서울특별시 중구 을지로2가 195",
    totalSpaces: 200,
    availableSpaces: 8,
    congestionLevel: 'crowded',
    hourlyRate: 2800,
    facilities: ["지하주차", "24시간", "발렛파킹"],
    distance: 0.5,
    rating: 4.0
  },
  {
    id: 8,
    name: "중구청 공영주차장",
    address: "서울특별시 중구 다산로 120",
    totalSpaces: 90,
    availableSpaces: 78,
    congestionLevel: 'available',
    hourlyRate: 1200,
    facilities: ["야외주차", "CCTV"],
    distance: 1.0,
    rating: 3.5
  }
];

// 주차장 카드 컴포넌트
function ParkingLotCard({ parking }: { parking: ParkingLot }) {
  const getCongestionColor = (level: ParkingLot['congestionLevel']) => {
    switch (level) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'crowded':
        return 'text-orange-600 bg-orange-50';
      case 'full':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCongestionText = (level: ParkingLot['congestionLevel']) => {
    switch (level) {
      case 'available':
        return '여유';
      case 'moderate':
        return '보통';
      case 'crowded':
        return '혼잡';
      case 'full':
        return '만차';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{parking.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCongestionColor(parking.congestionLevel)}`}>
          {getCongestionText(parking.congestionLevel)}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mb-2">{parking.address}</p>
      
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">
          {parking.availableSpaces}/{parking.totalSpaces} 자리
        </span>
        <span className="text-xs font-medium text-blue-600">
          {parking.hourlyRate.toLocaleString()}원/시간
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{parking.distance}km</span>
        <div className="flex items-center">
          <span className="text-xs text-yellow-500">★</span>
          <span className="text-xs text-gray-600 ml-1">{parking.rating}</span>
        </div>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-1">
        {parking.facilities.slice(0, 2).map((facility, index) => (
          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {facility}
          </span>
        ))}
        {parking.facilities.length > 2 && (
          <span className="text-xs text-gray-500">+{parking.facilities.length - 2}</span>
        )}
      </div>
    </div>
  );
}

export default function ParkingInfoPanel({ 
  isOpen, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  onSearch 
}: ParkingInfoPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleSearch = () => {
    onSearch();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const getCongestionColor = (level: ParkingLot['congestionLevel']) => {
    switch (level) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'crowded':
        return 'text-orange-600 bg-orange-50';
      case 'full':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCongestionText = (level: ParkingLot['congestionLevel']) => {
    switch (level) {
      case 'available':
        return '여유';
      case 'moderate':
        return '보통';
      case 'crowded':
        return '혼잡';
      case 'full':
        return '만차';
      default:
        return '알 수 없음';
    }
  };

  const filteredParkingLots = sampleParkingLots.filter(lot => {
    if (selectedFilter === "all") return true;
    return lot.congestionLevel === selectedFilter;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredParkingLots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParkingLots = filteredParkingLots.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white shadow-xl border-r border-gray-200 z-40 overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <BuildingOfficeIcon className="h-5 w-5" />
          <span>주차장 정보</span>
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="주차장 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            검색
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700">혼잡도 필터:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-2 py-1 rounded text-xs ${
                selectedFilter === "all" 
                  ? "bg-blue-500 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => handleFilterChange("available")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                selectedFilter === "available" 
                  ? "bg-green-500 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>여유</span>
            </button>
            <button
              onClick={() => handleFilterChange("moderate")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                selectedFilter === "moderate" 
                  ? "bg-yellow-500 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>보통</span>
            </button>
            <button
              onClick={() => handleFilterChange("crowded")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                selectedFilter === "crowded" 
                  ? "bg-orange-500 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>혼잡</span>
            </button>
            <button
              onClick={() => handleFilterChange("full")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                selectedFilter === "full" 
                  ? "bg-red-500 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>만차</span>
            </button>
          </div>
        </div>
      </div>

      {/* 주차장 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {currentParkingLots.length > 0 ? (
            currentParkingLots.map((parking) => (
              <ParkingLotCard key={parking.id} parking={parking} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>검색 결과가 없습니다.</p>
              <p className="text-sm">다른 키워드로 검색해보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {filteredParkingLots.length > itemsPerPage && (
        <div className="border-t border-gray-200 px-4 py-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              총 {filteredParkingLots.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredParkingLots.length)}개 표시
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}