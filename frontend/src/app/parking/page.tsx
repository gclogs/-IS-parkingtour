"use client";

import type React from "react";
import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { KakaoMap, MapMarker } from "@/components/map";
import toast from "react-hot-toast";
import { convex, isConvexConfigured } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { CongestionLevel } from '@/types/congestion';
import { submitCongestionVote, getCongestionData } from '@/services/congestionService';
import type { MarkerData, ContextMenuState } from '@/types/marker';

// 공통 컴포넌트 import
import { SearchButton } from "@/components/ui/SearchButton";
import { CreateMarkerFAB } from "@/components/ui/CreateMarkerFAB";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { MarkerInfoPanel } from "@/components/ui/MarkerInfoPanel";
import { CreateMarkerModal } from "@/components/ui/CreateMarkerModal";
import { ParkingMapModal } from "@/components/parking/ParkingMapModal";

// 메인 홈페이지 컴포넌트를 별도로 분리
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 인증 상태 (임시로 false 설정, 추후 실제 인증 시스템과 연동)
  const isLoggedIn = false;

  // 상태 관리
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [useCustomMarkers, setUseCustomMarkers] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [showMarkerDetailModal, setShowMarkerDetailModal] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);
  // Convex에서 불러온 마커들
  const [convexMarkers, setConvexMarkers] = useState<MarkerData[]>([]);
  const [nextMarkerId, setNextMarkerId] = useState(1000);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [mapLevel, setMapLevel] = useState(3);

  // 검색 모달 상태
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMarkerImage, setShowMarkerImage] = useState(true);
  const [showParkingMapModal, setShowParkingMapModal] = useState(false); // 주차장 지도 모달 상태

  // 마커 hover 시 prefetch 기능
  const queryClient = useQueryClient();
  
  const handleMarkerHover = (marker: MarkerData) => {
    // 상세 페이지 데이터 prefetch
    const detailId = marker.serverId || String(marker.id);
    queryClient.prefetchQuery({
      queryKey: ["marker", detailId],
      queryFn: async () => {
        // 실제 상세 데이터 로딩 로직 (상세 페이지와 동일)
        if (marker.serverId && isConvexConfigured) {
          try {
            const doc = await convex.query(api.markers.getById, { id: marker.serverId as any });
            if (doc) {
              return {
                id: doc._id as unknown as string,
                name: doc.name,
                category: doc.category,
                description: doc.description,
                address: doc.address,
                position: doc.position,
                rating: doc.rating,
                images: [],
                author: "서버 데이터",
                createdAt: "",
              };
            }
          } catch (e) {
            console.warn("Prefetch 실패:", e);
          }
        }
        return marker;
      },
      staleTime: 5 * 60 * 1000, // 5분
    });
  };

  const handleCreateMarkerFromContext = () => {
    if (!newMarkerPosition) return;

    // 새 페이지로 이동하면서 위치 정보 전달
    const lat = newMarkerPosition.lat;
    const lng = newMarkerPosition.lng;
    router.push(`/create-marker?lat=${lat}&lng=${lng}`);

    setContextMenu(null);
    setTempMarker(null);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setTempMarker(null); // 임시 마커도 제거
  };

  const handleCreateMarkerSubmit = (formData: {
    name: string;
    category: string;
    description: string;
  }) => {
    if (!newMarkerPosition) return;

    const newMarker: MarkerData = {
      id: nextMarkerId,
      name: formData.name,
      category: 'parking', // 주차장 페이지에서는 항상 parking 카테고리로 설정
      description: formData.description,
      position: newMarkerPosition,
      address: "주소 정보 없음", // 추후 역지오코딩 API로 실제 주소 가져오기
    };

    setNextMarkerId(nextMarkerId + 1);
    setShowMarkerModal(false);
    setNewMarkerPosition(null);
    setTempMarker(null); // 임시 마커 제거
  };

  const handleCloseModal = () => {
    setShowMarkerModal(false);
    setNewMarkerPosition(null);
    setTempMarker(null); // 임시 마커 제거
  };


  // Convex 마커 가져오기 (한 번만 실행)
  useEffect(() => { 
    let cancelled = false;
    async function fetchConvexMarkers() {
      if (!isConvexConfigured || typeof window === 'undefined') {
        setConvexMarkers([]);
        return;
      }
      try {
        const list = await convex.query(api.markers.list, {});
        if (cancelled) return;
        
        // parking 카테고리만 필터링
        const parkingMarkers = (list || []).filter((doc: any) => doc.category === 'parking');
        
        const mapped: MarkerData[] = await Promise.all(parkingMarkers.map(async (doc: any, idx: number) => {
          const markerId = (10000 + idx).toString();
          const congestionData = getCongestionData(markerId);
          
          return {
            id: 10000 + idx, // UI용 임시 숫자 ID
            serverId: doc._id,
            name: doc.name,
            category: doc.category,
            description: doc.description,
            address: doc.address,
            position: doc.position,
            rating: doc.rating,
            congestionVotes: congestionData.votes,
            congestionStats: congestionData.stats,
          };
        }));
        setConvexMarkers(mapped);
      } catch (e) {
        console.error("Convex 마커 불러오기 실패", e);
      }
    }
    fetchConvexMarkers();
    return () => {
      cancelled = true;
    };
  }, []);

  // URL 파라미터 처리 (마커 생성 후 위치 이동)
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const zoom = searchParams.get("zoom");

    if (lat && lng) {
      const newCenter = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      // 현재 center와 다를 때만 업데이트
      if (mapCenter.lat !== newCenter.lat || mapCenter.lng !== newCenter.lng) {
        setMapCenter(newCenter);
      }

      if (zoom) {
        const newLevel = parseInt(zoom);
        // 현재 level과 다를 때만 업데이트
        if (mapLevel !== newLevel) {
          setMapLevel(newLevel);
        }
      }

      // URL 파라미터 정리
      router.replace("/", { scroll: false });
    }
  }, [searchParams]); // router, mapCenter, mapLevel 제거

  // 새로 생성된 마커 선택을 위한 ref
  const convexMarkersRef = useRef<MarkerData[]>([]);
  
  // convexMarkers 상태가 변경될 때 ref 업데이트
  useEffect(() => {
    convexMarkersRef.current = convexMarkers;
  }, [convexMarkers]);

  // 새로 생성된 마커 선택 처리 함수 (useCallback으로 최적화)
  const selectNewMarker = useCallback((newMarkerId: string) => {
    const created = convexMarkersRef.current.find((m) => m.serverId === newMarkerId);
    if (created) {
      setSelectedMarker(created);
      setShowMarkerDetailModal(true);
      return true;
    }
    return false;
  }, []);

  // 새로 생성된 마커 선택 처리 (searchParams만 의존성으로)
  useEffect(() => {
    const newMarkerId = searchParams.get("newMarker");
    if (newMarkerId) {
      // 즉시 시도
      if (!selectNewMarker(newMarkerId)) {
        // 실패하면 마커가 로드될 때까지 기다리는 로직
        let retryCount = 0;
        const maxRetries = 50; // 최대 50번 시도 (5초)
        
        const checkAndSelectMarker = () => {
          retryCount++;
          
          // 최대 재시도 횟수 초과 시 중단
          if (retryCount > maxRetries) {
            console.warn(`마커 ${newMarkerId}를 찾을 수 없습니다. 재시도를 중단합니다.`);
            return;
          }
          
          // 마커 선택 재시도
          if (!selectNewMarker(newMarkerId)) {
            // 마커가 아직 로드되지 않았다면 잠시 후 다시 시도
            setTimeout(checkAndSelectMarker, 100);
          }
        };
        checkAndSelectMarker();
      }
    }
  }, [searchParams, selectNewMarker]);

  //
  // 커스텀 마커 이미지 설정
  const customMarkerImage = {
    src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
    size: { width: 64, height: 69 },
    options: {
      offset: { x: 27, y: 69 },
    },
  };

  // 마커 필터링 함수
  const getFilteredMarkers = (markers: MarkerData[]) => {
    if (selectedCategory === "전체") {
      return markers;
    }
    return markers.filter((marker) => marker.category === selectedCategory);
  };
  const handleMapLoad = (mapData: any) => {
    setMapInstance(mapData.map);
    console.log("지도가 로드되었습니다:", mapData);
  };

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setShowMarkerDetailModal(true);
    console.log("마커 클릭:", marker);
  };

  const handleCreateMarker = () => {
    // 기본 위치로 새 페이지 이동
    const lat = 37.5665;
    const lng = 126.978;
    router.push(`/create-marker?lat=${lat}&lng=${lng}`);
  };

  const handleCloseDetailModal = () => {
    setShowMarkerDetailModal(false);
  };

  const handleViewDetailsFromModal = (markerId: number) => {
    // Convex 마커인 경우 서버 ID로 라우팅
    if (selectedMarker && selectedMarker.serverId) {
      setShowMarkerDetailModal(false);
      router.push(`/detail/information/${selectedMarker.serverId}`);
      return;
    }
    // 로컬/샘플 마커인 경우 숫자 ID로 라우팅
    setShowMarkerDetailModal(false);
    router.push(`/detail/information/${markerId}`);
  };

  const toggleMarkerImage = () => {
    setUseCustomMarkers(!useCustomMarkers);
  };

  // 지도 우클릭 이벤트 핸들러 (react-kakao-maps-sdk 이벤트 시스템 사용)
  const handleMapRightClick = (target: any, mouseEvent: any) => {
    const latlng = mouseEvent.latLng;
    const position = { lat: latlng.getLat(), lng: latlng.getLng() };
    
    setNewMarkerPosition(position);
    setTempMarker(position); // 임시 마커 표시
    
    // 컨텍스트 메뉴 위치 설정
    setContextMenu({
      x: mouseEvent.point.x,
      y: mouseEvent.point.y,
    });
  };

  // 혼잡도 투표 핸들러
  const handleCongestionVote = async (markerId: string | number, level: CongestionLevel) => {
    try {
      const response = await submitCongestionVote(markerId.toString(), level);
      
      if (response.success) {
        // 마커 목록 업데이트
        setConvexMarkers(prevMarkers => 
          prevMarkers.map(marker => 
            marker.id === markerId 
              ? { ...marker, congestionVotes: response.votes, congestionStats: response.stats }
              : marker
          )
        );

        // 선택된 마커 업데이트
        if (selectedMarker && selectedMarker.id === markerId) {
          setSelectedMarker(prev => prev ? {
            ...prev,
            congestionVotes: response.votes,
            congestionStats: response.stats
          } : null);
        }

        toast.success('혼잡도 투표가 완료되었습니다!');
      } else {
        toast.error(response.error || '투표 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('혼잡도 투표 오류:', error);
      toast.error('투표 처리 중 오류가 발생했습니다.');
    }
  };

  // 세부정보 페이지로 이동하는 함수
  const handleViewDetails = (markerId: number) => {
    // 선택된 마커가 Convex 마커인 경우 서버 ID 사용
    const marker = convexMarkers.find(m => m.id === markerId);
    if (marker && marker.serverId) {
      router.push(`/detail/information/${marker.serverId}`);
    } else {
      router.push(`/detail/information/${markerId}`);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 마커 정보 사이드 패널 */}
      <MarkerInfoPanel 
        selectedMarker={selectedMarker} 
        onViewDetails={handleViewDetails}
        onCongestionVote={handleCongestionVote}
      />

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        contextMenu={contextMenu}
        onCreateMarker={handleCreateMarkerFromContext}
        onClose={handleCloseContextMenu}
      />

      {/* 마커 생성 모달 */}
      <CreateMarkerModal
        isOpen={showMarkerModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateMarkerSubmit}
        defaultCategory="parking"
        fixedCategory={true}
      />

      {/* 마커 상세 정보 모달 */}
      <Modal isOpen={showMarkerDetailModal} onClose={handleCloseDetailModal} title={selectedMarker?.name || ""}>
        {selectedMarker && (
          <>
            <ModalBody>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">카테고리:</span>
                  <span className="ml-2 text-gray-600">{selectedMarker.category}</span>
                </div>

                {/* 평점 표시 */}
                <div>
                  <span className="font-semibold text-gray-700">평점:</span>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (selectedMarker.rating || 0) ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedMarker.rating ? `${selectedMarker.rating}.0` : "평점 없음"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">설명:</span>
                  <p className="mt-1 text-gray-600">{selectedMarker.description}</p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">주소:</span>
                  <p className="mt-1 text-gray-600">{selectedMarker.address}</p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">위치:</span>
                  <p className="mt-1 text-gray-600">
                    위도: {selectedMarker.position.lat.toFixed(6)}, 경도:{" "}
                    {selectedMarker.position.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={handleCloseDetailModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => handleViewDetailsFromModal(selectedMarker.id)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                자세히 보기
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* 주차장 지도 모달 */}
      <ParkingMapModal isOpen={showParkingMapModal} onClose={() => setShowParkingMapModal(false)} />

      {/* 주차장 검색 버튼 - 플로팅 버튼 */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setShowParkingMapModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 sm:px-4 sm:py-3"
          title="주차장 검색"
        >
          <span className="text-lg">🅿️</span>
          <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">주차장 검색</span>
        </button>
      </div>

      {/* 모바일용 하단 주차장 검색 버튼 */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-30 sm:hidden">
        <button
          onClick={() => setShowParkingMapModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          title="주차장 검색"
        >
          <span className="text-lg">🅿️</span>
          <span className="text-sm font-medium">주차장 검색</span>
        </button>
      </div>

      {/* 카카오 지도 */}
      <div className="w-full h-full">
        <KakaoMap
          width="100%"
          height="100vh"
          center={mapCenter}
          level={mapLevel}
          className="relative"
          onMapLoad={handleMapLoad}
          onRightClick={handleMapRightClick}
          draggable={true}
        >
          {/* Convex에서 불러온 마커들 */}
          {getFilteredMarkers(convexMarkers).map((marker) => (
            <MapMarker
              key={`server-${marker.id}`}
              position={marker.position}
              title={marker.name}
              onClick={() => handleMarkerClick(marker)}
              onMouseOver={() => handleMarkerHover(marker)}
              image={useCustomMarkers ? customMarkerImage : undefined}
            />
          ))}

          {/* 임시 마커 (우클릭 시 표시) */}
          {tempMarker && (
            <MapMarker
              position={tempMarker}
              title="새 마커 위치"
              image={{
                src:
                  "data:image/svg+xml;base64," +
                  btoa(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#ff6b6b" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="#fff"/>
                  </svg>
                `),
                size: { width: 24, height: 24 },
              }}
            />
          )}
        </KakaoMap>
      </div>
    </div>
  );
}

// 메인 export 컴포넌트에 Suspense 추가
export default function HomePage() {
  return (
    <Suspense fallback={<div className="relative w-full h-screen overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">지도를 로딩 중입니다...</p>
      </div>
    </div>}>
      <HomePageContent />
    </Suspense>
  );
}
