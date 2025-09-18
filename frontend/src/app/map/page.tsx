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
import { CreateMarkerModal } from "@/components/ui/CreateMarkerModal";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
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
    };

    loadInitialData();
  }, []);

  // URL 파라미터에서 마커 ID 확인
  useEffect(() => {
    const markerId = searchParams.get('marker');
    if (markerId && markers.length > 0) {
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

  // 마커 생성 핸들러
  const handleCreateMarker = useCallback(() => {
    setContextMenu(null);
    setIsCreateModalOpen(true);
  }, []);

  // 마커 생성 제출 핸들러
  const handleCreateMarkerSubmit = useCallback(async (data: { 
    name: string; 
    category: string; 
    description: string; 
    rating: number;
    congestionVotes?: { available: number; moderate: number; crowded: number };
  }) => {
    if (!clickPosition || !isConvexConfigured) return;

    try {
      const newMarker = await convex.mutation(api.markers.create, {
        name: data.name,
        category: data.category,
        description: data.description,
        lat: clickPosition.lat,
        lng: clickPosition.lng,
        rating: data.rating,
        address: "주소 정보 없음",
        congestionVotes: data.congestionVotes,
      });

      // 마커 목록 업데이트
      const transformedNewMarker: MarkerData = {
        id: newMarker._id,
        name: newMarker.name,
        category: newMarker.category,
        description: newMarker.description,
        address: newMarker.address,
        rating: newMarker.rating,
        position: {
          lat: newMarker.lat,
          lng: newMarker.lng
        },
        congestionVotes: newMarker.congestionVotes,
        congestionStats: newMarker.congestionStats,
        images: [],
        commentCount: 0,
        createdAt: new Date().toISOString(),
        author: '익명',
        viewCount: 0,
        likes: 0
      };
      
      setMarkers(prev => [transformedNewMarker, ...prev]);
      setIsCreateModalOpen(false);
      setClickPosition(null);
      
      toast.success("마커가 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("마커 생성 실패:", error);
      toast.error("마커 생성에 실패했습니다.");
    }
  }, [clickPosition]);

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
              className="w-full px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              주차장 전용 지도
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <CreateMarkerFAB onClick={() => setIsCreateModalOpen(true)} />
      </div>

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        contextMenu={contextMenu}
        onCreateMarker={handleCreateMarker}
        onClose={handleCloseContextMenu}
      />

      {/* 마커 생성 모달 */}
      <CreateMarkerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMarkerSubmit}
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
