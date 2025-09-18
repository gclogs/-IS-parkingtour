import React from 'react';

interface ParkingControlsProps {
  showParkingMarkers: boolean;
  onToggleParkingMarkers: (show: boolean) => void;
  selectedCongestionLevel: 'all' | 'low' | 'medium' | 'high';
  onCongestionLevelChange: (level: 'all' | 'low' | 'medium' | 'high') => void;
  parkingMarkersCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export function ParkingControls({
  showParkingMarkers,
  onToggleParkingMarkers,
  selectedCongestionLevel,
  onCongestionLevelChange,
  parkingMarkersCount,
  loading,
  onRefresh
}: ParkingControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 min-w-[280px]">
      <div className="space-y-4">
        {/* 주차장 마커 표시 토글 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🅿️</span>
            <span className="font-medium text-gray-700">주차장 마커</span>
            <span className="text-sm text-gray-500">({parkingMarkersCount}개)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showParkingMarkers}
              onChange={(e) => onToggleParkingMarkers(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 혼잡도 필터 */}
        {showParkingMarkers && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">혼잡도 필터</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onCongestionLevelChange('all')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                  selectedCongestionLevel === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => onCongestionLevelChange('low')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedCongestionLevel === 'low'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current"></div>
                여유
              </button>
              <button
                onClick={() => onCongestionLevelChange('medium')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedCongestionLevel === 'medium'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current"></div>
                보통
              </button>
              <button
                onClick={() => onCongestionLevelChange('high')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedCongestionLevel === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current"></div>
                혼잡
              </button>
            </div>
          </div>
        )}

        {/* 새로고침 버튼 */}
        {showParkingMarkers && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              {loading ? '로딩 중...' : '실시간 주차 정보'}
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {loading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParkingControls;