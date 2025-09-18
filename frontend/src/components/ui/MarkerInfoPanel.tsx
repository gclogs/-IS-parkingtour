"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import type { MarkerData } from "@/types/marker";
import type { ParkingMarkerData } from "@/hooks/useParkingMarkers";
import { type CongestionLevel, congestionUtils } from "@/types/congestion";

interface MarkerInfoPanelProps {
  selectedMarker: MarkerData | ParkingMarkerData | null;
  onViewDetails: (markerId: number) => void;
  onCongestionVote?: (markerId: string | number, level: CongestionLevel) => void;
}

export function MarkerInfoPanel({
  selectedMarker,
  onViewDetails,
  onCongestionVote,
}: MarkerInfoPanelProps) {
  if (!selectedMarker) {
    return (
      <div className="absolute top-20 right-4 w-80 max-h-96 overflow-hidden">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>마커를 선택해주세요</CardTitle>
            <CardDescription>지도에서 마커를 클릭하면 상세 정보가 표시됩니다</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              지도에서 마커를 선택하면 이곳에 장소 정보, 사진, 댓글 등이 표시됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 주차장 마커인지 확인
  const isParkingMarker = 'congestionLevel' in selectedMarker || 'occupancyRate' in selectedMarker;
  const stats = 'congestionStats' in selectedMarker ? selectedMarker.congestionStats : null;
  const votes = 'congestionVotes' in selectedMarker ? selectedMarker.congestionVotes : null;
  const dominantLevel = votes ? congestionUtils.getDominantLevel(votes) : null;

  return (
    <div className="absolute top-20 right-4 w-80 max-h-96 overflow-y-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isParkingMarker && (
              <span className="text-lg">🅿️</span>
            )}
            {selectedMarker.name}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {selectedMarker.category}
            {isParkingMarker && 'congestionLevel' in selectedMarker && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedMarker.congestionLevel === 'low' ? 'bg-green-100 text-green-800' :
                selectedMarker.congestionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedMarker.congestionLevel === 'low' ? '여유' :
                 selectedMarker.congestionLevel === 'medium' ? '보통' : '혼잡'}
              </span>
            )}
            {!isParkingMarker && dominantLevel && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${congestionUtils.getColorClass(dominantLevel)}`}>
                {congestionUtils.getLevelText(dominantLevel)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 whitespace-pre-line">{selectedMarker.description}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>📍 {selectedMarker.address}</span>
          </div>
          
          {/* 주차장 정보 표시 */}
          {isParkingMarker && 'occupancyRate' in selectedMarker && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">점유율:</span>
                    <span>{selectedMarker.occupancyRate.toFixed(1)}%</span>
                  </div>
                  {'parkingInfo' in selectedMarker && selectedMarker.parkingInfo.realtime && (
                    <div className="flex justify-between">
                      <span className="font-medium">현재 주차:</span>
                      <span>{selectedMarker.parkingInfo.realtime.curParking}/{selectedMarker.parkingInfo.realtime.capacity}대</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 혼잡도 투표 섹션 - 일반 마커용 */}
          {!isParkingMarker && onCongestionVote && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">혼잡도 정보</h4>
                {dominantLevel && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${congestionUtils.getColorClass(dominantLevel)}`}>
                    {congestionUtils.getLevelText(dominantLevel)}
                  </span>
                )}
              </div>

              {stats && stats.totalVotes > 0 ? (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>여유</span>
                    <span>보통</span>
                    <span>혼잡</span>
                  </div>
                  <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${stats.availablePercentage}%` }}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${stats.moderatePercentage}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${stats.crowdedPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{'congestionVotes' in selectedMarker ? selectedMarker.congestionVotes?.available || 0 : 0}</span>
                    <span>{'congestionVotes' in selectedMarker ? selectedMarker.congestionVotes?.moderate || 0 : 0}</span>
                    <span>{'congestionVotes' in selectedMarker ? selectedMarker.congestionVotes?.crowded || 0 : 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">아직 투표가 없습니다</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onCongestionVote(selectedMarker.id, 'available')}
                  className="flex flex-col items-center p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                >
                  <span className="text-lg">🟢</span>
                  <span className="text-xs font-medium text-green-700">여유</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCongestionVote(selectedMarker.id, 'moderate')}
                  className="flex flex-col items-center p-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200"
                >
                  <span className="text-lg">🟡</span>
                  <span className="text-xs font-medium text-yellow-700">보통</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCongestionVote(selectedMarker.id, 'crowded')}
                  className="flex flex-col items-center p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  <span className="text-lg">🔴</span>
                  <span className="text-xs font-medium text-red-700">혼잡</span>
                </button>
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={() => onViewDetails(typeof selectedMarker.id === 'string' ? parseInt(selectedMarker.id) : selectedMarker.id)}
            className="w-full px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            세부정보 보기
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
