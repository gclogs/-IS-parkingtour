"use client";

import type React from "react";
import { useState, useCallback } from "react";
import {
  Map,
  MapMarker as KakaoMapMarker,
  MapInfoWindow,
  useKakaoLoader,
} from "react-kakao-maps-sdk";

interface KakaoMapProps {
  width?: string;
  height?: string;
  center?: {
    lat: number;
    lng: number;
  };
  level?: number;
  className?: string;
  children?: React.ReactNode;
  onMapLoad?: (mapInstance: {
    map: any;
    updateCenter: (center: { lat: number; lng: number }) => void;
    updateLevel: (level: number) => void;
  }) => void;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onRightClick?: (target: any, mouseEvent: any) => void;
  showClickMarker?: boolean;
  onClickPositionChange?: (position: { lat: number; lng: number }) => void;
  draggable?: boolean;
}

export function KakaoMap({
  width = "100%",
  height = "400px",
  center = { lat: 37.5665, lng: 126.978 }, // 서울시청 기본 좌표
  level = 3,
  className = "",
  children,
  onMapLoad,
  onMapClick,
  onRightClick,
  showClickMarker = false,
  onClickPositionChange,
  draggable = true,
}: KakaoMapProps) {
  const [map, setMap] = useState<any>(null);
  const [clickMarker, setClickMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null);

  // 카카오 지도 API 로드
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "",
    libraries: ["services", "clusterer", "drawing"],
  });


  // 지도 클릭 이벤트 핸들러
  const handleMapClick = useCallback(
    (_target: any, mouseEvent: any) => {
      if (!showClickMarker) return;

      const latlng = mouseEvent.latLng;
      const position = {
        lat: latlng.getLat(),
        lng: latlng.getLng(),
      };

      // 클릭 마커 위치 업데이트
      setClickMarker(position);
      setClickPosition(position);

      // 콜백 함수 호출
      if (onMapClick) onMapClick(position);
      if (onClickPositionChange) onClickPositionChange(position);
    },
    [showClickMarker, onMapClick, onClickPositionChange]
  );

  // 지도 생성 완료 이벤트 핸들러
  const handleMapCreate = useCallback(
    (mapInstance: any) => {
      setMap(mapInstance);

      // 지도 제어 메서드들
      const updateCenter = (newCenter: { lat: number; lng: number }) => {
        mapInstance.setCenter(new window.kakao.maps.LatLng(newCenter.lat, newCenter.lng));
      };

      const updateLevel = (newLevel: number) => {
        mapInstance.setLevel(newLevel);
      };

      // 부모 컴포넌트에 지도 인스턴스 전달
      if (onMapLoad) {
        onMapLoad({
          map: mapInstance,
          updateCenter,
          updateLevel,
        });
      }
    },
    [onMapLoad]
  );

  // 로딩 상태
  if (loading) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div
        className={`relative flex items-center justify-center bg-red-50 rounded-lg border border-red-200 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 text-sm font-medium mb-2">지도 로드 실패</p>
          <p className="text-red-600 text-xs mb-3">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Map
        center={{ lat: center.lat, lng: center.lng }}
        style={{ width, height }}
        level={level}
        onClick={handleMapClick}
        onRightClick={onRightClick}
        onCreate={handleMapCreate}
        className="rounded-lg overflow-hidden"
        draggable={draggable}
      >
        {/* children으로 전달된 마커들 렌더링 */}
        {children}

        {/* 클릭 마커 표시 */}
        {showClickMarker && clickMarker && (
          <KakaoMapMarker
            position={clickMarker}
            image={{
              src: "https://img.icons8.com/color/48/visit.png",
              size: { width: 24, height: 35 },
            }}
          />
        )}
      </Map>

      {/* 클릭 위치 정보 표시 */}
      {showClickMarker && clickPosition && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10">
          <div className="text-sm font-medium text-gray-700 mb-1">클릭한 위치</div>
          <div className="text-xs text-gray-600">
            <div>위도: {clickPosition.lat.toFixed(6)}</div>
            <div>경도: {clickPosition.lng.toFixed(6)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 개선된 MapMarker 컴포넌트 (react-kakao-maps-sdk 기반)
interface MapMarkerProps {
  position: {
    lat: number;
    lng: number;
  };
  title?: string;
  content?: string;
  onClick?: () => void;
  onMouseOver?: () => void;
  draggable?: boolean;
  onPositionChange?: (position: { lat: number; lng: number }) => void;
  image?: {
    src: string;
    size: { width: number; height: number };
    options?: {
      offset?: { x: number; y: number };
    };
  };
}

export function MapMarker({
  position,
  title,
  content,
  onClick,
  onMouseOver,
  draggable = false,
  onPositionChange,
  image,
}: MapMarkerProps) {
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

  // 마커 클릭 이벤트 핸들러
  const handleMarkerClick = useCallback(() => {
    if (content) {
      setIsInfoWindowOpen(true);
    }
    if (onClick) onClick();
  }, [content, onClick]);

  // 마커 마우스 오버 이벤트 핸들러
  const handleMarkerMouseOver = useCallback(() => {
    if (onMouseOver) onMouseOver();
  }, [onMouseOver]);

  // 드래그 종료 이벤트 핸들러
  const handleDragEnd = useCallback(
    (marker: any) => {
      if (onPositionChange) {
        const latlng = marker.getPosition();
        const newPosition = {
          lat: latlng.getLat(),
          lng: latlng.getLng(),
        };
        onPositionChange(newPosition);
      }
    },
    [onPositionChange]
  );

  return (
    <>
      <KakaoMapMarker
        position={position}
        title={title}
        image={image}
        draggable={draggable}
        onClick={handleMarkerClick}
        onMouseOver={handleMarkerMouseOver}
        onDragEnd={handleDragEnd}
      />

      {/* 인포윈도우 */}
      {content && isInfoWindowOpen && (
        <MapInfoWindow position={position} removable={true}>
          <div style={{ padding: "5px", minWidth: "150px" }}>{content}</div>
        </MapInfoWindow>
      )}
    </>
  );
}
