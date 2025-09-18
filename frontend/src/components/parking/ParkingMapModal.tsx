"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Map, MapMarker, MapInfoWindow, useKakaoLoader } from 'react-kakao-maps-sdk';
import { X, Search, MapPin, Clock, Car, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui';
import { parkingApiService, type CombinedParkingInfo, type ParkingSearchOptions, type ParkingSearchResult } from '@/services/parkingApi';

interface ParkingMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParkingMapModal({ isOpen, onClose }: ParkingMapModalProps) {
  const [searchOptions, setSearchOptions] = useState<ParkingSearchOptions>({});
  const [searchResult, setSearchResult] = useState<ParkingSearchResult | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<CombinedParkingInfo | any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showRealtimeOnly, setShowRealtimeOnly] = useState(false);
  
  // 로컬 스토리지 마커 관련 상태
  const [localStorageMarkers, setLocalStorageMarkers] = useState<Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    capacity: number;
    type: string;
    timestamp: number;
  }>>([]);
  const [showLocalMarkers, setShowLocalMarkers] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.566826, lng: 126.9786567 });
  const [mapLevel, setMapLevel] = useState(8);

  // Kakao Maps SDK 로드
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || "",
    libraries: ["services"],
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      handleSearch();
      loadLocalStorageMarkers(); // 로컬 스토리지 마커 로드
    }
  }, [isOpen]);

  // 로컬 스토리지에서 마커 데이터 로드
  const loadLocalStorageMarkers = useCallback(() => {
    console.log('📦 로컬 스토리지에서 마커 데이터 로드...');
    const markers = parkingApiService.loadMarkersFromLocalStorage();
    setLocalStorageMarkers(markers);
    
    if (markers.length > 0) {
      console.log(`✅ ${markers.length}개 로컬 마커 로드 완료`);
    }
  }, []);

  // 마커 데이터를 로컬 스토리지에 저장
  const saveMarkersToStorage = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('💾 마커 데이터 저장 시작...');
      await parkingApiService.saveMarkersToLocalStorage();
      
      // 저장 후 다시 로드
      loadLocalStorageMarkers();
      
      console.log('✅ 마커 데이터 저장 및 로드 완료');
    } catch (error) {
      console.error('❌ 마커 데이터 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadLocalStorageMarkers]);

  // 마커들의 중심으로 지도 이동
  const moveToMarkersCenter = useCallback(() => {
    const markersToUse = showLocalMarkers ? localStorageMarkers : searchResult?.data || [];
    
    if (markersToUse.length === 0) {
      console.warn('⚠️ 표시할 마커가 없습니다.');
      return;
    }

    let center;
    if (showLocalMarkers) {
      center = parkingApiService.calculateMarkersCenter(localStorageMarkers);
    } else {
      center = parkingApiService.calculateMarkersCenter(
        searchResult?.data.map(p => ({ lat: p.prk_plce_entrc_la, lng: p.prk_plce_entrc_lo })) || []
      );
    }

    setMapCenter(center);
    setMapLevel(6); // 줌 레벨 조정
    console.log('🎯 지도 중심 이동:', center);
  }, [showLocalMarkers, localStorageMarkers, searchResult]);

  // 로컬 스토리지 마커 초기화
  const clearLocalMarkers = useCallback(() => {
    parkingApiService.clearMarkersFromLocalStorage();
    setLocalStorageMarkers([]);
    console.log('🗑️ 로컬 마커 데이터 초기화 완료');
  }, []);

  // 검색 실행
  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    console.log('🔍 주차장 검색 시작:', { selectedCity, searchKeyword, showRealtimeOnly });
    
    try {
      const options: ParkingSearchOptions = {
        cityName: selectedCity || undefined,
        keyword: searchKeyword || undefined,
        includeRealtimeOnly: showRealtimeOnly
      };

      console.log('📡 ParkingAPI 호출 중...', options);
      
      // 1. 기본 검색 실행
      const result = await parkingApiService.searchParkingLots(options);
      console.log('✅ 검색 결과:', {
        totalCount: result.totalCount,
        filteredCount: result.filteredCount,
        cities: result.cities,
        sampleData: result.data.slice(0, 3) // 처음 3개 데이터만 로그
      });
      
      setSearchResult(result);

      // 2. 키워드가 있으면 새로운 매칭 시스템 실행
      if (searchKeyword) {
        console.log('🚀 키워드 기반 매칭 시스템 실행...');
        await parkingApiService.executeFullProcess(searchKeyword);
      }

    } catch (error) {
      console.error('❌ 주차장 검색 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, searchKeyword, showRealtimeOnly]);

  // 마커 색상 결정
  const getMarkerColor = (parking: CombinedParkingInfo): string => {
    if (!parking.hasRealtimeData) return '#9CA3AF'; // 회색 - 실시간 데이터 없음
    
    switch (parking.congestionLevel) {
      case 'high': return '#EF4444'; // 빨강 - 혼잡
      case 'medium': return '#F59E0B'; // 주황 - 보통
      case 'low': return '#10B981'; // 초록 - 여유
      default: return '#6B7280'; // 기본 회색
    }
  };

  // 점유율 표시 텍스트
  const getOccupancyText = (parking: CombinedParkingInfo): string => {
    if (!parking.hasRealtimeData) return '실시간 정보 없음';
    return `${parking.occupancyRate}% (${parking.occupied}/${parking.realtime?.pkfc_ParkingLots_total || 0})`;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">지도를 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">지도 로딩 오류</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            주차장 지도
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 검색 컨트롤 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-3 items-center">
            {/* 도시 선택 */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">전체 도시</option>
              {searchResult?.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* 키워드 검색 */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="주차장명 또는 주소 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                />
              </div>
            </div>

            {/* 필터 옵션 */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showRealtimeOnly}
                onChange={(e) => setShowRealtimeOnly(e.target.checked)}
                className="rounded"
              />
              실시간 정보만
            </label>

            {/* 로컬 마커 표시 옵션 */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showLocalMarkers}
                onChange={(e) => setShowLocalMarkers(e.target.checked)}
                className="rounded"
              />
              로컬 마커 표시
            </label>

            {/* 검색 버튼 */}
            <Button 
              onClick={() => {
                console.log('🔘 검색 버튼 클릭');
                handleSearch();
              }} 
              disabled={isLoading} 
              size="sm"
            >
              {isLoading ? '검색 중...' : '검색'}
            </Button>

            {/* 검색 결과 요약 */}
            {searchResult && (
              <div className="mt-3 text-sm text-gray-600">
                전체 {searchResult.totalCount}개 중 {searchResult.filteredCount}개 표시
                {searchResult.cities.length > 0 && (
                  <span className="ml-2">
                    (도시: {searchResult.cities.join(', ')})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 로컬 스토리지 관리 버튼들 */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <Button
              onClick={saveMarkersToStorage}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              💾 마커 저장
            </Button>
            
            <Button
              onClick={moveToMarkersCenter}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              🎯 중심 이동
            </Button>
            
            <Button
              onClick={clearLocalMarkers}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="text-xs text-red-600 hover:text-red-700"
            >
              🗑️ 초기화
            </Button>
            
            {localStorageMarkers.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center">
                📦 저장된 마커: {localStorageMarkers.length}개
              </span>
            )}
          </div>

          {/* 지도 영역 */}
          <div className="flex-1 relative">
            <Map
              center={mapCenter}
              style={{ width: "100%", height: "100%" }}
              level={mapLevel}
            >
              {showLocalMarkers ? localStorageMarkers.map((marker) => (
                <React.Fragment key={marker.id}>
                  <MapMarker
                    position={{
                      lat: marker.lat,
                      lng: marker.lng
                    }}
                    onClick={() => setSelectedMarker(marker as any)}
                    image={{
                      src: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#6B7280">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      `)}`,
                      size: { width: 24, height: 24 },
                      options: { offset: { x: 12, y: 24 } }
                    }}
                  />

                  {/* 로컬 마커 정보창 */}
                  {selectedMarker && 'type' in selectedMarker && selectedMarker.id === marker.id && (
                    <MapInfoWindow
                      position={{
                        lat: marker.lat,
                        lng: marker.lng
                      }}
                      removable={true}
                    >
                      <div className="p-3 min-w-[250px]">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {marker.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{marker.address}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              총 {marker.capacity || 0}면
                            </span>
                          </div>

                          <div className="text-gray-500 text-xs bg-blue-100 px-2 py-1 rounded">
                            로컬 저장 데이터
                          </div>

                          <div className="text-xs text-gray-400">
                            ID: {marker.id}
                          </div>
                        </div>
                      </div>
                    </MapInfoWindow>
                  )}
                </React.Fragment>
              )) : searchResult?.data.map((parking) => (
                <React.Fragment key={parking.prk_center_id}>
                  <MapMarker
                    position={{
                      lat: parking.prk_plce_entrc_la,
                      lng: parking.prk_plce_entrc_lo
                    }}
                    onClick={() => setSelectedMarker(parking)}
                    image={{
                      src: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${getMarkerColor(parking)}">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      `)}`,
                      size: { width: 24, height: 24 },
                      options: { offset: { x: 12, y: 24 } }
                    }}
                  />

                  {selectedMarker && 'prk_center_id' in selectedMarker && selectedMarker.prk_center_id === parking.prk_center_id && (
                    <MapInfoWindow
                      position={{
                        lat: parking.prk_plce_entrc_la,
                        lng: parking.prk_plce_entrc_lo
                      }}
                      removable={true}
                    >
                      <div className="p-3 min-w-[250px]">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {parking.prk_plce_nm}
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{parking.prk_plce_adres}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              총 {parking.prk_cmprt_co || parking.realtime?.pkfc_ParkingLots_total || 0}면
                            </span>
                          </div>

                          {parking.hasRealtimeData && parking.realtime && (
                            <>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                  가용: {parking.realtime.pkfc_Available_ParkingLots_total}면
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: getMarkerColor(parking) }}
                                />
                                <span className="text-gray-600">
                                  점유율: {getOccupancyText(parking)}
                                </span>
                              </div>
                            </>
                          )}

                          {!parking.hasRealtimeData && (
                            <div className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                              실시간 정보 없음
                            </div>
                          )}
                        </div>
                      </div>
                    </MapInfoWindow>
                  )}
                </React.Fragment>
              ))}
            </Map>

            {/* 범례 */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <h4 className="text-sm font-semibold mb-2">범례</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>여유 (50% 미만)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>보통 (50-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>혼잡 (80% 이상)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>정보 없음</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
