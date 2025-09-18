"use client";

import type React from "react";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Map,
  MapMarker,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import toast from "react-hot-toast";
import { convex, isConvexConfigured } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { MarkerData } from '@/types/marker';
import { useParkingMarkers, type ParkingMarkerData } from "@/hooks/useParkingMarkers";

// 공통 컴포넌트 import
import { CreateMarkerFAB } from "@/components/ui/CreateMarkerFAB";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { MarkerInfoPanel } from "@/components/ui/MarkerInfoPanel";
import { ParkingMapModal } from "@/components/parking/ParkingMapModal";

// 검색 결과 타입 정의
interface SearchResult {
  place_name: string;
  address_name: string;
  category_name?: string;
  x: string;
  y: string;
}

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | ParkingMarkerData | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 37.566826, lng: 126.9786567 });
  const [level, setLevel] = useState(3);
  const [showParkingMarkers, setShowParkingMarkers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showParkingMapModal, setShowParkingMapModal] = useState(false);

  // 주차장 마커 데이터 가져오기
  const { parkingMarkers, loading: isParkingLoading, error: parkingError } = useParkingMarkers();

  // Kakao Maps SDK 로드
  const [loading, kakaoError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || "",
    libraries: ["services", "clusterer", "drawing"],
  });

  // 마커 데이터 로드 함수
  const loadMarkersData = useCallback(async () => {
    if (!isConvexConfigured) {
      setError("Convex가 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const markersData = await convex.query(api.markers.list);
      
      // Convex 데이터를 MarkerData 형식으로 변환
      const transformedMarkers: MarkerData[] = markersData.map((marker: any, index: number) => ({
        id: marker._id,
        name: marker.name,
        category: marker.category,
        description: marker.description,
        address: marker.address,
        rating: marker.rating,
        position: {
          lat: marker.lat || marker.position?.lat || 37.566826,
          lng: marker.lng || marker.position?.lng || 126.9786567
        },
        congestionVotes: marker.congestionVotes,
        congestionStats: marker.congestionStats,
        // 게시판 기능을 위한 추가 데이터
        images: marker.images || [],
        commentCount: marker.commentCount || 0,
        createdAt: marker.createdAt || new Date().toISOString(),
        author: marker.author || '익명',
        viewCount: marker.viewCount || 0,
        likes: marker.likes || 0
      }));
      
      setMarkers(transformedMarkers);
    } catch (err) {
      console.error("마커 데이터 로드 실패:", err);
      setError("마커 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadMarkersData();
  }, [loadMarkersData]);

  // URL 파라미터에서 마커 ID 및 새 마커 확인
  useEffect(() => {
    const markerId = searchParams.get('marker');
    const newMarkerId = searchParams.get('newMarker');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    // 새로 생성된 마커가 있는 경우
    if (newMarkerId && lat && lng) {
      setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setLevel(zoom ? parseInt(zoom) : 2);
      
      // 마커 데이터를 새로고침하여 새로 생성된 마커를 가져옴
      loadMarkersData().then(() => {
        // 새로고침 후 새 마커 찾기 시도
        setTimeout(() => {
          const newMarker = markers.find(m => m.id.toString() === newMarkerId);
          if (newMarker) {
            setSelectedMarker(newMarker);
            toast.success("새로 생성된 마커로 이동했습니다!");
          }
        }, 500); // 약간의 지연을 두어 데이터 로드 완료 대기
      });
    }
    // 기존 마커 선택 로직
    else if (markerId && markers.length > 0) {
      const marker = markers.find(m => m.id.toString() === markerId);
      if (marker && marker.position) {
        setSelectedMarker(marker);
        setCenter({ lat: marker.position.lat, lng: marker.position.lng });
        setLevel(2);
      }
    }
  }, [searchParams, markers]);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((marker: MarkerData | ParkingMarkerData) => {
    setSelectedMarker(marker);
  }, []);

  // 지도 우클릭 핸들러
  const handleMapRightClick = useCallback((target: any, mouseEvent: any) => {
    const latlng = mouseEvent.latLng;
    setClickPosition({ lat: latlng.getLat(), lng: latlng.getLng() });
    setContextMenu({
      x: mouseEvent.point.x,
      y: mouseEvent.point.y,
    });
  }, []);

  // 컨텍스트 메뉴 닫기
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 마커 생성 핸들러 (페이지로 이동)
  const handleCreateMarker = useCallback(() => {
    setContextMenu(null);
    // 클릭한 위치 정보를 URL 파라미터로 전달
    if (clickPosition) {
      router.push(`/create-marker?lat=${clickPosition.lat}&lng=${clickPosition.lng}`);
    } else {
      router.push('/create-marker');
    }
  }, [clickPosition, router]);


  // 세부정보 보기 핸들러
  const handleViewDetails = useCallback((markerId: number) => {
    router.push(`/detail/information/${markerId}`);
  }, [router]);

  // 혼잡도 투표 핸들러
  const handleCongestionVote = useCallback(async (markerId: string | number, level: any) => {
    // 혼잡도 투표 로직 구현
    toast.success("투표가 완료되었습니다!");
  }, []);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (kakaoError || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">오류가 발생했습니다:</p>
          <p className="text-gray-600">{kakaoError?.message || error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* 지도 */}
      <Map
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={level}
        onRightClick={handleMapRightClick}
        onCreate={setMap}
      >
        {/* 일반 마커들 */}
        {markers.map((marker) => {
          // position 데이터 유효성 검사
          if (!marker.position || typeof marker.position.lat !== 'number' || typeof marker.position.lng !== 'number') {
            console.warn(`마커 ${marker.id}의 position 데이터가 유효하지 않습니다:`, marker.position);
            return null;
          }
          
          return (
            <MapMarker
              key={marker.id}
              position={{ lat: marker.position.lat, lng: marker.position.lng }}
              onClick={() => handleMarkerClick(marker)}
              title={marker.name}
            />
          );
        })}

        {/* 주차장 마커들 */}
        {showParkingMarkers && parkingMarkers.map((marker) => {
          if (!marker.position || typeof marker.position.lat !== 'number' || typeof marker.position.lng !== 'number') {
            console.warn(`주차장 마커 ${marker.id}의 position 데이터가 유효하지 않습니다:`, marker.position);
            return null;
          }
          
          return (
            <MapMarker
              key={`parking-${marker.id}`}
              position={{ lat: marker.position.lat, lng: marker.position.lng }}
              onClick={() => handleMarkerClick(marker)}
              title={marker.name}
              image={{
                src: "/parking-marker.png",
                size: { width: 32, height: 32 },
                options: { offset: { x: 16, y: 32 } }
              }}
            />
          );
        })}
      </Map>

      {/* UI 컴포넌트들 */}
      <MarkerInfoPanel
        selectedMarker={selectedMarker}
        onViewDetails={handleViewDetails}
        onCongestionVote={handleCongestionVote}
      />

      {/* 지도 정보 모달 */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 min-w-[250px] border border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗺️</span>
            <span className="font-semibold text-gray-800">지도 정보</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">전체 마커:</span>
              <span className="font-medium text-blue-600">{markers.length}개</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">주차장 마커:</span>
              <span className="font-medium text-green-600">{parkingMarkers.length}개</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Parking 카테고리:</span>
              <span className="font-medium text-purple-600">
                {markers.filter(m => m.category === 'parking').length}개
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">주차장 마커 표시</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showParkingMarkers}
                  onChange={(e) => setShowParkingMarkers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* 주차장 지도 버튼 */}
            <button
              onClick={() => setShowParkingMapModal(true)}
              className="w-full px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors flex items-center justify-center gap-1 mb-2"
            >
              주차장 전용 지도
            </button>
            
            {/* 마커 생성 페이지로 이동 버튼 */}
            <button
              onClick={() => router.push('/create-marker')}
              className="w-full px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md border border-green-200 transition-colors flex items-center justify-center gap-1 mb-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              마커 생성 페이지
            </button>
            
            {/* 마커 새로고침 버튼 */}
            <button
              onClick={loadMarkersData}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md border border-gray-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? '새로고침 중...' : '마커 새로고침'}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <CreateMarkerFAB onClick={() => router.push('/create-marker')} />
      </div>

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        contextMenu={contextMenu}
        onCreateMarker={handleCreateMarker}
        onClose={handleCloseContextMenu}
      />


      {/* 주차장 지도 모달 */}
      <ParkingMapModal
        isOpen={showParkingMapModal}
        onClose={() => setShowParkingMapModal(false)}
      />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
