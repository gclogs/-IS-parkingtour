import React from 'react';
import type { ParkingMarkerData } from '@/hooks/useParkingMarkers';

interface ParkingInfoWindowProps {
  marker: ParkingMarkerData;
  onClose: () => void;
}

export function ParkingInfoWindow({ marker, onClose }: ParkingInfoWindowProps) {
  const getCongestionText = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return '여유';
      case 'medium': return '보통';
      case 'high': return '혼잡';
    }
  };

  const getCongestionColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const occupancyRate = marker.parkingInfo.realtime && marker.parkingInfo.realtime.capacity > 0 
    ? Math.round((marker.parkingInfo.realtime.curParking / marker.parkingInfo.realtime.capacity) * 100)
    : Math.round(marker.occupancyRate || 0);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px] max-w-[320px]">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{marker.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg">🅿️</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCongestionColor(marker.congestionLevel)}`}>
              {getCongestionText(marker.congestionLevel)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 주차 정보 */}
      <div className="space-y-3">
        {/* 점유율 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">점유율</span>
            <span className="text-lg font-bold text-gray-900">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                occupancyRate >= 80 ? 'bg-red-500' : 
                occupancyRate >= 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* 주차 현황 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {marker.parkingInfo.realtime?.curParking || 0}
            </div>
            <div className="text-xs text-blue-600 font-medium">현재 주차</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {marker.parkingInfo.realtime?.capacity || marker.parkingInfo.prkcmprt || 0}
            </div>
            <div className="text-xs text-gray-600 font-medium">전체 자리</div>
          </div>
        </div>

        {/* 주소 */}
        {marker.address && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-gray-600">{marker.address}</span>
            </div>
          </div>
        )}

        {/* 요금 정보 */}
        {marker.parkingInfo.basicCharge && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm font-medium text-yellow-700">주차 요금</span>
            </div>
            <span className="text-sm text-yellow-600">
              기본요금: {marker.parkingInfo.basicCharge}원 ({marker.parkingInfo.basicTime}분)
            </span>
          </div>
        )}

        {/* 운영시간 */}
        {marker.parkingInfo.operation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              평일: {marker.parkingInfo.operation.weekdayOperOpenHhmm || '정보없음'} - {marker.parkingInfo.operation.weekdayOperColseHhmm || '정보없음'}
            </span>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => {
            // 카카오맵 길찾기 연결
            const url = `https://map.kakao.com/link/to/${encodeURIComponent(marker.name)},${marker.position.lat},${marker.position.lng}`;
            window.open(url, '_blank');
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
          길찾기
        </button>
      </div>
    </div>
  );
}

export default ParkingInfoWindow;