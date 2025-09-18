"use client";

import type React from 'react';
import type { AppMarker } from '@/types/marker';

interface MarkerInfoOverlayProps {
  marker: AppMarker;
  onClose: () => void;
  onViewDetails: (markerId: number) => void;
}

export const MarkerInfoOverlay: React.FC<MarkerInfoOverlayProps> = ({
  marker,
  onClose,
  onViewDetails,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(marker.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px] max-w-[320px] relative">
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="닫기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 헤더 */}
      <div className="mb-3 pr-6">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{marker.name}</h3>
        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
          {getCategoryLabel(marker.category)}
        </span>
      </div>

      {/* 내용 */}
      <div className="space-y-2 mb-4">
        {/* 평점 */}
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">평점:</span>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= (marker.rating || 0) ? "text-yellow-400" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-600">
              {marker.rating ? `${marker.rating}.0` : "평점 없음"}
            </span>
          </div>
        </div>

        {/* 설명 */}
        {marker.description && (
          <div>
            <span className="text-sm font-medium text-gray-700">설명:</span>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{marker.description}</p>
          </div>
        )}

        {/* 주소 */}
        {marker.address && (
          <div>
            <span className="text-sm font-medium text-gray-700">주소:</span>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{marker.address}</p>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          닫기
        </button>
        <button
          type="button"
          onClick={handleViewDetails}
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          자세히 보기
        </button>
      </div>

      {/* 말풍선 꼬리 */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
      </div>
    </div>
  );
};

// 카테고리 라벨 변환 함수
function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    parking: '🅿️ 주차장',
    restaurant: '🍽️ 맛집',
    cafe: '☕ 카페',
    tourist: '🏛️ 관광지',
    accommodation: '🏨 숙박',
    other: '📍 기타',
  };
  return categoryMap[category] || '📍 기타';
}