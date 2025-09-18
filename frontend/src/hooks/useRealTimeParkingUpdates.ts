import { useState, useEffect, useCallback, useRef } from 'react';
import type { ParkingMarkerData } from './useParkingMarkers';

interface UseRealTimeParkingUpdatesProps {
  parkingMarkers: ParkingMarkerData[];
  onMarkersUpdate: (updatedMarkers: ParkingMarkerData[]) => void;
  updateInterval?: number; // 업데이트 간격 (밀리초)
  enabled?: boolean;
}

export function useRealTimeParkingUpdates({
  parkingMarkers,
  onMarkersUpdate,
  updateInterval = 30000, // 기본 30초
  enabled = true
}: UseRealTimeParkingUpdatesProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 주차 정보 시뮬레이션 함수
  const simulateParkingUpdate = useCallback((marker: ParkingMarkerData): ParkingMarkerData => {
    // 실제 환경에서는 API 호출로 대체
    const currentParked = marker.parkingInfo.realtime?.curParking || 0;
    const totalSpaces = marker.parkingInfo.realtime?.capacity || 0;
    
    // 랜덤하게 주차 상황 변화 시뮬레이션
    const changeAmount = Math.floor(Math.random() * 5) - 2; // -2 ~ +2 변화
    const newCurrentParked = Math.max(0, Math.min(totalSpaces, currentParked + changeAmount));
    
    // 점유율 계산
    const occupancyRate = totalSpaces > 0 ? (newCurrentParked / totalSpaces) * 100 : 0;
    
    // 혼잡도 계산
    let congestionLevel: 'low' | 'medium' | 'high';
    if (occupancyRate < 50) {
      congestionLevel = 'low';
    } else if (occupancyRate < 80) {
      congestionLevel = 'medium';
    } else {
      congestionLevel = 'high';
    }

    // 업데이트된 실시간 정보로 마커 데이터 반환
    const updatedRealtimeInfo = marker.parkingInfo.realtime ? {
      ...marker.parkingInfo.realtime,
      curParking: newCurrentParked,
      referenceDate: new Date().toISOString().split('T')[0],
      referenceTime: new Date().toTimeString().split(' ')[0]
    } : undefined;

    return {
      ...marker,
      congestionLevel,
      occupancyRate,
      parkingInfo: {
        ...marker.parkingInfo,
        realtime: updatedRealtimeInfo,
        occupancyRate,
        congestionLevel
      }
    };
  }, []);

  // 실제 API에서 주차 정보를 가져오는 함수 (시뮬레이션)
  const fetchRealTimeParkingData = useCallback(async (markerId: string): Promise<Partial<ParkingMarkerData> | null> => {
    try {
      // 실제 환경에서는 실제 API 엔드포인트 호출
      // const response = await fetch(`/api/parking/${markerId}/realtime`);
      // const data = await response.json();
      // return data;

      // 시뮬레이션: 랜덤 데이터 생성
      await new Promise(resolve => setTimeout(resolve, 100)); // API 지연 시뮬레이션
      
      const marker = parkingMarkers.find(m => m.id === markerId);
      if (!marker) return null;

      return simulateParkingUpdate(marker);
    } catch (error) {
      console.error(`주차장 ${markerId} 실시간 정보 업데이트 실패:`, error);
      return null;
    }
  }, [parkingMarkers, simulateParkingUpdate]);

  // 모든 주차장 정보 업데이트
  const updateAllParkingData = useCallback(async () => {
    if (!enabled || parkingMarkers.length === 0) return;

    setIsUpdating(true);
    
    try {
      const updatePromises = parkingMarkers.map(async (marker) => {
        const updatedData = await fetchRealTimeParkingData(marker.id);
        return updatedData ? { ...marker, ...updatedData } : marker;
      });

      const updatedMarkers = await Promise.all(updatePromises);
      onMarkersUpdate(updatedMarkers);
      setLastUpdateTime(new Date());
      
      console.log('주차장 실시간 정보 업데이트 완료:', updatedMarkers.length, '개');
    } catch (error) {
      console.error('주차장 실시간 정보 업데이트 중 오류:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [enabled, parkingMarkers, fetchRealTimeParkingData, onMarkersUpdate]);

  // 특정 주차장 정보만 업데이트
  const updateSingleParkingData = useCallback(async (markerId: string) => {
    if (!enabled) return;

    setIsUpdating(true);
    
    try {
      const updatedData = await fetchRealTimeParkingData(markerId);
      if (updatedData) {
        const updatedMarkers = parkingMarkers.map(marker => 
          marker.id === markerId ? { ...marker, ...updatedData } : marker
        );
        onMarkersUpdate(updatedMarkers);
        setLastUpdateTime(new Date());
        
        console.log(`주차장 ${markerId} 실시간 정보 업데이트 완료`);
      }
    } catch (error) {
      console.error(`주차장 ${markerId} 실시간 정보 업데이트 중 오류:`, error);
    } finally {
      setIsUpdating(false);
    }
  }, [enabled, parkingMarkers, fetchRealTimeParkingData, onMarkersUpdate]);

  // 자동 업데이트 시작/중지
  const startAutoUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateAllParkingData();
    }, updateInterval);

    // 즉시 한 번 업데이트
    updateAllParkingData();
  }, [updateAllParkingData, updateInterval]);

  const stopAutoUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 컴포넌트 마운트/언마운트 시 자동 업데이트 관리
  useEffect(() => {
    if (enabled && parkingMarkers.length > 0) {
      startAutoUpdate();
    } else {
      stopAutoUpdate();
    }

    return () => {
      stopAutoUpdate();
    };
  }, [enabled, parkingMarkers.length, startAutoUpdate, stopAutoUpdate]);

  // 업데이트 간격 변경 시 재시작
  useEffect(() => {
    if (enabled && intervalRef.current) {
      startAutoUpdate();
    }
  }, [updateInterval, enabled, startAutoUpdate]);

  return {
    isUpdating,
    lastUpdateTime,
    updateAllParkingData,
    updateSingleParkingData,
    startAutoUpdate,
    stopAutoUpdate
  };
}

export default useRealTimeParkingUpdates;