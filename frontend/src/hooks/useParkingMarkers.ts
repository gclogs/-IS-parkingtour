import { useState, useEffect, useCallback } from 'react';
import { parkingApiService, type CombinedParkingInfo } from '@/services/parkingApi';

// 주차장 마커 데이터 타입
export interface ParkingMarkerData {
  id: string;
  name: string;
  category: string;
  description: string;
  position: { lat: number; lng: number };
  address: string;
  rating?: number;
  congestionLevel: 'low' | 'medium' | 'high';
  occupancyRate: number;
  parkingInfo: CombinedParkingInfo;
}

// 마커 색상 및 아이콘 설정
export const getMarkerStyle = (congestionLevel: 'low' | 'medium' | 'high') => {
  const styles = {
    low: {
      color: '#10b981', // 초록색 - 여유
      icon: '🅿️',
      label: '여유'
    },
    medium: {
      color: '#f59e0b', // 주황색 - 보통
      icon: '🅿️',
      label: '보통'
    },
    high: {
      color: '#ef4444', // 빨간색 - 혼잡
      icon: '🅿️',
      label: '혼잡'
    }
  };
  return styles[congestionLevel];
};

// SVG 마커 이미지 생성
export const createParkingMarkerImage = (congestionLevel: 'low' | 'medium' | 'high') => {
  const style = getMarkerStyle(congestionLevel);
  
  const svgContent = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${style.color}"/>
      <circle cx="16" cy="16" r="10" fill="white"/>
      <text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${style.color}">P</text>
    </svg>
  `;
  
  return {
    src: `data:image/svg+xml;base64,${btoa(svgContent)}`,
    size: { width: 32, height: 40 },
    options: {
      offset: { x: 16, y: 40 }
    }
  };
};

export const useParkingMarkers = () => {
  const [parkingMarkers, setParkingMarkers] = useState<ParkingMarkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주차장 데이터를 마커 데이터로 변환
  const convertToMarkerData = useCallback((parkingData: CombinedParkingInfo[]): ParkingMarkerData[] => {
    return parkingData
      .filter(parking => parking.prk_plce_entrc_la && parking.prk_plce_entrc_lo) // 좌표가 있는 데이터만
      .map(parking => {
        // 운영 시간 정보 생성
        const operationInfo = parking.operation ? 
          `평일: ${parking.operation.weekdayOperOpenHhmm || '정보없음'} - ${parking.operation.weekdayOperColseHhmm || '정보없음'}` :
          '운영시간 정보 없음';

        // 주차 요금 정보
        const feeInfo = parking.prk_cmprt_co ? 
          `총 주차면수: ${parking.prk_cmprt_co}면` :
          '주차면수 정보 없음';

        // 실시간 주차 정보
        const realtimeInfo = parking.realtime ? 
          `현재 ${parking.realtime.pkfc_Available_ParkingLots_total}/${parking.realtime.pkfc_ParkingLots_total}대 가용 (${parking.occupancyRate?.toFixed(1)}% 점유)` :
          '실시간 정보 없음';

        return {
          id: parking.prk_center_id || `parking_${Math.random()}`,
          name: parking.prk_plce_nm || '주차장',
          category: '주차장',
          description: `${operationInfo}\n${feeInfo}\n${realtimeInfo}`,
          position: {
            lat: parking.prk_plce_entrc_la,
            lng: parking.prk_plce_entrc_lo
          },
          address: parking.prk_plce_adres || '주소 정보 없음',
          rating: undefined,
          congestionLevel: parking.congestionLevel || 'low',
          occupancyRate: parking.occupancyRate || 0,
          parkingInfo: parking
        };
      });
  }, []);

  // 모든 주차장 데이터 로드
  const loadAllParkingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const parkingData = await parkingApiService.getCombinedParkingInfo();
      const markerData = convertToMarkerData(parkingData);
      setParkingMarkers(markerData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '주차장 데이터 로드 실패';
      setError(errorMessage);
      console.error('주차장 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [convertToMarkerData]);

  // 특정 위치 주변 주차장 데이터 로드
  const loadParkingAroundLocation = useCallback(async (lat: number, lng: number, radius: number = 1000) => {
    setLoading(true);
    setError(null);
    
    try {
      const parkingData = await parkingApiService.getParkingAroundLocation(lat, lng, radius);
      const markerData = convertToMarkerData(parkingData);
      setParkingMarkers(markerData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '주변 주차장 데이터 로드 실패';
      setError(errorMessage);
      console.error('주변 주차장 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [convertToMarkerData]);

  // 주차장 데이터 새로고침
  const refreshParkingData = useCallback(async () => {
    await loadAllParkingData();
  }, [loadAllParkingData]);

  // 혼잡도별 마커 필터링
  const getMarkersByCongestionLevel = useCallback((level: 'low' | 'medium' | 'high') => {
    return parkingMarkers.filter(marker => marker.congestionLevel === level);
  }, [parkingMarkers]);

  // 혼잡도에 따른 마커 이미지 생성
  const createParkingMarkerImage = useCallback((congestionLevel: 'low' | 'medium' | 'high') => {
    const colors = {
      low: '#10B981',    // 초록색 - 여유
      medium: '#F59E0B', // 노란색 - 보통  
      high: '#EF4444'    // 빨간색 - 혼잡
    };

    const color = colors[congestionLevel];
    
    // SVG 마커 생성
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, []);

  // 점유율 범위별 마커 필터링
  const getMarkersByOccupancyRange = useCallback((min: number, max: number) => {
    return parkingMarkers.filter(marker => 
      marker.occupancyRate >= min && marker.occupancyRate <= max
    );
  }, [parkingMarkers]);

  // 마커 데이터 업데이트 함수
  const updateParkingMarkers = useCallback((updatedMarkers: ParkingMarkerData[]) => {
    setParkingMarkers(updatedMarkers);
  }, []);

  return {
    parkingMarkers,
    loading,
    error,
    loadAllParkingData,
    loadParkingAroundLocation,
    createParkingMarkerImage,
    getMarkerStyle,
    getMarkersByCongestionLevel,
    getMarkersByOccupancyRange,
    updateParkingMarkers,
    refreshParkingData: loadAllParkingData
  };
};