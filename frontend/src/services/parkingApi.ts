// 주차장 공공데이터 API 서비스 (문서 규격에 따른 필드명 수정)
export interface ParkingFacilityInfo {
  prk_plce_adres_sido: string; // 주차장 시도
  prk_center_id: string; // 주차장 관리 ID (확장ID)
  prk_plce_nm: string; // 주차장명
  prk_plce_adres: string; // 주차장 도로명 주소
  prk_plce_entrc_la: number; // 위도 (입구 위도)
  prk_plce_entrc_lo: number; // 경도 (입구 경도)
  prk_cmprt_co: number; // 총 주차 구획 수
  // 추가 필드들 (기존 호환성 유지)
  prkplceNo?: string; // 주차장번호 (호환성)
  prkplceNm?: string; // 주차장명 (호환성)
  latitude?: number; // 위도 (호환성)
  longitude?: number; // 경도 (호환성)
  prkcmprt?: number; // 주차구획수 (호환성)
}

export interface ParkingOperationInfo {
  prk_center_id: string; // 주차장 관리 ID
  // 요일별 운영시간 (문서 규격)
  Sunday?: {
    opertn_start_time: string; // 시작시간 (HHMMSS)
    opertn_end_time: string; // 종료시간 (HHMMSS)
  };
  Monday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Tuesday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Wednesday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Thursday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Friday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Saturday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  Holiday?: {
    opertn_start_time: string;
    opertn_end_time: string;
  };
  opertn_bs_free_time: number; // 기본회차(무료)시간 (분)
  basic_info: {
    parking_chrge_bs_time: number; // 기본시간 (분)
    parking_chrge_bs_chrge: number; // 기본요금 (원)
    parking_chrge_adit_unit_time: number; // 추가단위시간 (분)
    parking_chrge_adit_unit_chrge: number; // 추가단위요금 (원)
  };
  fxamt_info: {
    parking_chrge_one_day_chrge: number; // 1일 요금 (원)
    parking_chrge_mon_unit_chrge: number; // 월정액 (원)
  };
  // 기존 호환성 필드들
  weekdayOperOpenHhmm?: string;
  weekdayOperColseHhmm?: string;
  basicTime?: number;
  basicCharge?: number;
}

export interface ParkingRealtimeInfo {
  prk_center_id: string; // 주차장 관리 ID
  pkfc_ParkingLots_total: number; // 총 주차 구획 수
  pkfc_Available_ParkingLots_total: number; // 총 주차가능 구획 수
  // 기존 호환성 필드들
  prkplceNo?: string; // 주차장번호 (호환성)
  capacity?: number; // 주차용량 (호환성)
  curParking?: number; // 현재주차대수 (호환성)
}

export interface CombinedParkingInfo extends ParkingFacilityInfo {
  operation?: ParkingOperationInfo;
  realtime?: ParkingRealtimeInfo;
  occupancyRate?: number; // 점유율 (계산된 값)
  occupied?: number; // 점유 대수 (total - available)
  congestionLevel?: 'low' | 'medium' | 'high'; // 혼잡도 레벨
  hasRealtimeData?: boolean; // 실시간 데이터 존재 여부
  // 호환성을 위한 요금 정보 (operation에서 추출)
  basicCharge?: number; // 기본 요금
  basicTime?: number; // 기본 시간
}

// 도시별 검색을 위한 인터페이스
export interface ParkingSearchOptions {
  cityName?: string; // 도시명 (예: 인천, 익산, 전주)
  keyword?: string; // 키워드 검색 (주차장명에서 검색)
  includeRealtimeOnly?: boolean; // 실시간 데이터가 있는 것만 포함
}

// 검색 결과 인터페이스
export interface ParkingSearchResult {
  data: CombinedParkingInfo[];
  totalCount: number;
  filteredCount: number;
  cities: string[]; // 검색된 도시 목록
}

const BASE_URL = 'https://apis.data.go.kr/B553881/Parking';

class ParkingApiService {
  private serviceKey: string;

  constructor() {
    this.serviceKey = process.env.NEXT_PUBLIC_PARKING_API_SERVICE_KEY || '';
    if (!this.serviceKey) {
      console.warn('공공데이터 API 서비스 키가 설정되지 않았습니다.');
    }
  }

  private async fetchJSON(path: string, queryString: string = ''): Promise<any> {
    const encodedKey = encodeURIComponent(this.serviceKey);
    const url = `${BASE_URL}/${path}?serviceKey=${encodedKey}&format=2&numOfRows=100&pageNo=1${queryString}`;
    
    console.log(`🔍 API 호출 시작: ${path}`);
    console.log(`📡 요청 URL: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API 응답 오류 내용:`, errorText);
        throw new Error(`API ${path} 호출 실패: ${response.status} - ${errorText}`);
      }
      
      const jsonData = await response.json();
      console.log(`✅ API 응답 성공 (${path}):`, jsonData);
      
      // 응답 구조 분석
      if (jsonData.response) {
        console.log(`📋 응답 헤더:`, jsonData.response.header);
        console.log(`📦 응답 바디:`, jsonData.response.body);
        
        if (jsonData.response.body?.items) {
          console.log(`📄 아이템 수:`, Array.isArray(jsonData.response.body.items) 
            ? jsonData.response.body.items.length 
            : Object.keys(jsonData.response.body.items).length);
        }
      }
      
      return jsonData;
    } catch (error) {
      console.error(`💥 API 호출 오류 (${path}):`, error);
      throw error;
    }
  }

  // 주차장 시설 정보 조회
  async getParkingFacilityInfo(): Promise<ParkingFacilityInfo[]> {
    try {
      const data = await this.fetchJSON('PrkSttusInfo');
      const items = data?.response?.body?.items?.PrkSttusInfo || data?.response?.body?.items || [];
      
      // 필드명 매핑 (호환성 유지)
      return items.map((item: any) => ({
        ...item,
        // 호환성 필드 매핑
        prkplceNo: item.prk_center_id,
        prkplceNm: item.prk_plce_nm,
        latitude: item.prk_plce_entrc_la,
        longitude: item.prk_plce_entrc_lo,
        prkcmprt: item.prk_cmprt_co
      }));
    } catch (error) {
      console.error('주차장 시설 정보 조회 실패:', error);
      return [];
    }
  }

  // 주차장 운영 정보 조회
  async getParkingOperationInfo(): Promise<ParkingOperationInfo[]> {
    try {
      const data = await this.fetchJSON('PrkOprInfo');
      const items = data?.response?.body?.items?.PrkOprInfo || data?.response?.body?.items || [];
      
      // 필드명 매핑 (호환성 유지)
      return items.map((item: any) => ({
        ...item,
        // 호환성 필드 매핑
        weekdayOperOpenHhmm: item.Monday?.opertn_start_time || item.weekdayOperOpenHhmm,
        weekdayOperColseHhmm: item.Monday?.opertn_end_time || item.weekdayOperColseHhmm,
        basicTime: item.basic_info?.parking_chrge_bs_time || item.basicTime,
        basicCharge: item.basic_info?.parking_chrge_bs_chrge || item.basicCharge
      }));
    } catch (error) {
      console.error('주차장 운영 정보 조회 실패:', error);
      return [];
    }
  }

  // 주차장 실시간 정보 조회
  async getParkingRealtimeInfo(): Promise<ParkingRealtimeInfo[]> {
    try {
      const data = await this.fetchJSON('PrkRealtimeInfo');
      const items = data?.response?.body?.items?.PrkRealtimeInfo || data?.response?.body?.items || [];
      
      // 필드명 매핑 (호환성 유지)
      return items.map((item: any) => ({
        ...item,
        // 호환성 필드 매핑
        prkplceNo: item.prk_center_id,
        capacity: item.pkfc_ParkingLots_total,
        curParking: item.pkfc_ParkingLots_total - item.pkfc_Available_ParkingLots_total
      }));
    } catch (error) {
      console.error('주차장 실시간 정보 조회 실패:', error);
      return [];
    }
  }

  // 통합 주차장 정보 조회 (시설 + 운영 + 실시간)
  async getCombinedParkingInfo(): Promise<CombinedParkingInfo[]> {
    try {
      const [facilities, operations, realtimes] = await Promise.all([
        this.getParkingFacilityInfo(),
        this.getParkingOperationInfo(),
        this.getParkingRealtimeInfo()
      ]);

      // prk_center_id 기준으로 데이터 조인
      const combinedData: CombinedParkingInfo[] = facilities.map(facility => {
        const operation = operations.find(op => op.prk_center_id === facility.prk_center_id);
        const realtime = realtimes.find(rt => rt.prk_center_id === facility.prk_center_id);

        // 점유율 계산
        let occupancyRate = 0;
        let congestionLevel: 'low' | 'medium' | 'high' = 'low';

        if (realtime && (realtime.capacity || realtime.pkfc_ParkingLots_total) > 0) {
          const totalSpaces = realtime.capacity || realtime.pkfc_ParkingLots_total || 0;
          const usedSpaces = realtime.curParking || (totalSpaces - (realtime.pkfc_Available_ParkingLots_total || 0));
          occupancyRate = (usedSpaces / totalSpaces) * 100;
          
          // 혼잡도 레벨 계산
          if (occupancyRate >= 90) {
            congestionLevel = 'high';
          } else if (occupancyRate >= 70) {
            congestionLevel = 'medium';
          } else {
            congestionLevel = 'low';
          }
        }

        return {
          ...facility,
          operation,
          realtime,
          occupancyRate,
          congestionLevel,
          // 호환성을 위한 요금 정보 추출
          basicCharge: operation?.basic_info?.parking_chrge_bs_chrge || operation?.basicCharge,
          basicTime: operation?.basic_info?.parking_chrge_bs_time || operation?.basicTime
        };
      });

      return combinedData;
    } catch (error) {
      console.error('통합 주차장 정보 조회 실패:', error);
      return [];
    }
  }

  // 특정 지역 주변 주차장 정보 조회 (위도, 경도 기준)
  async getParkingAroundLocation(lat: number, lng: number, radius: number = 1000): Promise<CombinedParkingInfo[]> {
    try {
      const allParkingData = await this.getCombinedParkingInfo();
      
      // 거리 계산 함수 (Haversine formula)
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // 미터 단위로 반환
      };

      // 반경 내 주차장 필터링
      return allParkingData.filter(parking => {
        if (!parking.latitude || !parking.longitude) return false;
        const distance = calculateDistance(lat, lng, parking.latitude, parking.longitude);
        return distance <= radius;
      });
    } catch (error) {
      console.error('주변 주차장 정보 조회 실패:', error);
      return [];
    }
  }

  // 도시명 추출 함수 (주소에서 도시명 추출)
  private extractCityName(address: string): string {
    // 도시명 패턴 매칭 (시/군/구 단위)
    const cityPatterns = [
      /^([가-힣]+시)\s/,  // 서울시, 부산시, 인천시 등
      /^([가-힣]+군)\s/,  // 익산군, 전주군 등  
      /^([가-힣]+구)\s/,  // 강남구, 서초구 등
      /^([가-힣]+시)\s([가-힣]+구)/, // 서울시 강남구 등
    ];

    for (const pattern of cityPatterns) {
      const match = address.match(pattern);
      if (match) {
        return match[1]; // 첫 번째 캡처 그룹 반환
      }
    }

    // 패턴이 매칭되지 않으면 첫 번째 단어 반환
    const firstWord = address.split(' ')[0];
    return firstWord || '기타';
  }

  // 점유율 및 혼잡도 계산
  private calculateOccupancyData(realtime: ParkingRealtimeInfo) {
    const total = realtime.pkfc_ParkingLots_total || 0;
    const available = realtime.pkfc_Available_ParkingLots_total || 0;
    const occupied = Math.max(0, total - available);
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    let congestionLevel: 'low' | 'medium' | 'high' = 'low';
    if (occupancyRate >= 80) {
      congestionLevel = 'high';
    } else if (occupancyRate >= 50) {
      congestionLevel = 'medium';
    }

    return {
      occupied,
      occupancyRate: Math.round(occupancyRate * 100) / 100, // 소수점 2자리
      congestionLevel
    };
  }

  // 향상된 통합 주차장 정보 조회 (내부 조인 포함)
  async getEnhancedCombinedParkingInfo(): Promise<CombinedParkingInfo[]> {
    try {
      console.log('🔄 향상된 통합 주차장 정보 조회 시작...');
      
      // 모든 데이터를 병렬로 가져오기
      const [facilities, operations, realtimes] = await Promise.all([
        this.getParkingFacilityInfo(),
        this.getParkingOperationInfo(),
        this.getParkingRealtimeInfo()
      ]);

      console.log(`📊 데이터 수집 완료: 시설정보 ${facilities.length}개, 운영정보 ${operations.length}개, 실시간정보 ${realtimes.length}개`);

      // 실시간 정보를 prk_center_id로 맵핑
      const realtimeMap = new Map<string, ParkingRealtimeInfo>();
      realtimes.forEach(rt => {
        if (rt.prk_center_id) {
          realtimeMap.set(rt.prk_center_id, rt);
        }
      });

      // 운영 정보를 prk_center_id로 맵핑
      const operationMap = new Map<string, ParkingOperationInfo>();
      operations.forEach(op => {
        if (op.prk_center_id) {
          operationMap.set(op.prk_center_id, op);
        }
      });

      // 시설정보를 기준으로 내부 조인 수행
      const combinedData: CombinedParkingInfo[] = facilities.map(facility => {
        const realtime = realtimeMap.get(facility.prk_center_id);
        const operation = operationMap.get(facility.prk_center_id);
        
        let occupancyData: {
          occupied: number;
          occupancyRate: number;
          congestionLevel: 'low' | 'medium' | 'high';
        } = {
          occupied: 0,
          occupancyRate: 0,
          congestionLevel: 'low'
        };

        if (realtime) {
          occupancyData = this.calculateOccupancyData(realtime);
        }

        return {
          ...facility,
          operation,
          realtime,
          hasRealtimeData: !!realtime,
          ...occupancyData,
          // 호환성을 위한 요금 정보 추출
          basicCharge: operation?.basic_info?.parking_chrge_bs_chrge || operation?.basicCharge,
          basicTime: operation?.basic_info?.parking_chrge_bs_time || operation?.basicTime
        };
      });

      console.log(`✅ 통합 데이터 생성 완료: ${combinedData.length}개 (실시간 데이터 있음: ${combinedData.filter(d => d.hasRealtimeData).length}개)`);
      
      return combinedData;
    } catch (error) {
      console.error('향상된 통합 주차장 정보 조회 실패:', error);
      return [];
    }
  }

  // 도시별 및 키워드 검색 기능
  async searchParkingLots(options: ParkingSearchOptions = {}): Promise<ParkingSearchResult> {
    try {
      console.log('🔍 주차장 검색 시작:', options);
      
      const allData = await this.getEnhancedCombinedParkingInfo();
      let filteredData = [...allData];

      // 1. '주차장' 키워드 필터링 (필수)
      filteredData = filteredData.filter(item => 
        item.prk_plce_nm && item.prk_plce_nm.includes('주차장')
      );

      // 2. 도시명 필터링
      if (options.cityName) {
        filteredData = filteredData.filter(item => {
          const cityName = this.extractCityName(item.prk_plce_adres || '');
          return cityName.includes(options.cityName!) || options.cityName!.includes(cityName);
        });
      }

      // 3. 추가 키워드 검색
      if (options.keyword) {
        const keyword = options.keyword.toLowerCase();
        filteredData = filteredData.filter(item =>
          (item.prk_plce_nm || '').toLowerCase().includes(keyword) ||
          (item.prk_plce_adres || '').toLowerCase().includes(keyword)
        );
      }

      // 4. 실시간 데이터만 포함 옵션
      if (options.includeRealtimeOnly) {
        filteredData = filteredData.filter(item => item.hasRealtimeData);
      }

      // 5. 검색된 도시 목록 추출
      const cities = Array.from(new Set(
        filteredData.map(item => this.extractCityName(item.prk_plce_adres || ''))
      )).sort();

      console.log(`🎯 검색 완료: 전체 ${allData.length}개 → 필터링 후 ${filteredData.length}개`);
      console.log(`🏙️ 검색된 도시: ${cities.join(', ')}`);

      return {
        data: filteredData,
        totalCount: allData.length,
        filteredCount: filteredData.length,
        cities
      };
    } catch (error) {
      console.error('주차장 검색 실패:', error);
      return {
        data: [],
        totalCount: 0,
        filteredCount: 0,
        cities: []
      };
    }
  }

  // 캐시된 데이터 관리
  private static cachedData: CombinedParkingInfo[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  // 캐시를 활용한 빠른 데이터 조회
  async getCachedParkingData(): Promise<CombinedParkingInfo[]> {
    const now = Date.now();
    
    // 캐시가 유효한 경우 캐시된 데이터 반환
    if (ParkingApiService.cachedData && 
        (now - ParkingApiService.cacheTimestamp) < ParkingApiService.CACHE_DURATION) {
      console.log('📦 캐시된 주차장 데이터 사용');
      return ParkingApiService.cachedData;
    }

    // 캐시가 없거나 만료된 경우 새로 조회
    console.log('🔄 주차장 데이터 새로 조회 및 캐시 업데이트');
    const data = await this.getEnhancedCombinedParkingInfo();
    
    ParkingApiService.cachedData = data;
    ParkingApiService.cacheTimestamp = now;
    
    return data;
  }

  // 캐시 초기화
  static clearCache(): void {
    ParkingApiService.cachedData = null;
    ParkingApiService.cacheTimestamp = 0;
    console.log('🗑️ 주차장 데이터 캐시 초기화');
  }

  // 페이지별 시설정보 조회 및 sido 분석
  async analyzePrkSttusInfoBySido(keyword?: string): Promise<void> {
    console.log('🔍 PrkSttusInfo 페이지별 sido 분석 시작:', keyword);
    
    if (!this.serviceKey) {
      console.error('❌ API 키가 설정되지 않았습니다.');
      return;
    }

    const sidoMap = new Map<string, number>();
    let totalCount = 0;
    let pageNo = 1;
    const numOfRows = 100; // 페이지당 항목 수

    try {
      while (true) {
        console.log(`📄 페이지 ${pageNo} 조회 중...`);
        
        const queryString = `numOfRows=${numOfRows}&pageNo=${pageNo}&type=json`;
        const response = await this.fetchJSON('/PrkSttusInfo', queryString);
        
        if (!response?.response?.body?.items) {
          console.log(`📄 페이지 ${pageNo}: 데이터 없음, 조회 종료`);
          break;
        }

        const items = response.response.body.items;
        console.log(`📄 페이지 ${pageNo}: ${items.length}개 항목 조회`);

        // 각 항목의 sido 분석
        items.forEach((item: any) => {
          if (item.prk_plce_adres_sido) {
            const sido = item.prk_plce_adres_sido;
            sidoMap.set(sido, (sidoMap.get(sido) || 0) + 1);
          }

          // 키워드가 있으면 매칭 확인
          if (keyword && item.prk_plce_nm) {
            if (item.prk_plce_nm.toLowerCase().includes(keyword.toLowerCase())) {
              console.log(`🎯 키워드 매칭 발견:`, {
                name: item.prk_plce_nm,
                sido: item.prk_plce_adres_sido,
                address: item.prk_plce_adres,
                centerId: item.prk_center_id
              });
            }
          }
        });

        totalCount += items.length;

        // 다음 페이지가 없으면 종료
        if (items.length < numOfRows) {
          console.log(`📄 마지막 페이지 ${pageNo} 도달`);
          break;
        }

        pageNo++;
        
        // 너무 많은 페이지 방지 (최대 50페이지)
        if (pageNo > 50) {
          console.log('⚠️ 최대 페이지 수 도달, 조회 중단');
          break;
        }

        // API 호출 간격 조절 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('📊 PrkSttusInfo sido 분석 결과:');
      console.log(`총 ${totalCount}개 시설 조회`);
      console.log('시도별 분포:');
      
      // sido별 정렬하여 출력
      const sortedSido = Array.from(sidoMap.entries()).sort((a, b) => b[1] - a[1]);
      sortedSido.forEach(([sido, count]) => {
        console.log(`  ${sido}: ${count}개`);
      });

    } catch (error) {
      console.error('❌ PrkSttusInfo sido 분석 실패:', error);
    }
  }

  // 로컬 스토리지 키 정의
  private static readonly FACILITY_STORAGE_KEY = 'parking_facility_data';
  private static readonly KEYWORD_STORAGE_KEY = 'parking_keyword_data';

  // PrkSttusInfo 데이터를 로컬 스토리지에 저장
  async saveFacilityDataToStorage(): Promise<void> {
    console.log('💾 PrkSttusInfo 데이터를 로컬 스토리지에 저장 시작...');
    
    try {
      const facilities = await this.getParkingFacilityInfo();
      
      // prk_center_id를 키로 하는 맵 생성
      const facilityMap: { [key: string]: ParkingFacilityInfo } = {};
      facilities.forEach(facility => {
        if (facility.prk_center_id) {
          facilityMap[facility.prk_center_id] = facility;
        }
      });

      // 로컬 스토리지에 저장 (얕은 복사)
      localStorage.setItem(ParkingApiService.FACILITY_STORAGE_KEY, JSON.stringify(facilityMap));
      
      console.log(`✅ ${facilities.length}개 시설 데이터 저장 완료`);
      console.log('📋 저장된 prk_center_id 샘플:', Object.keys(facilityMap).slice(0, 5));
      
    } catch (error) {
      console.error('❌ 시설 데이터 저장 실패:', error);
    }
  }

  // 로컬 스토리지에서 시설 데이터 로드
  private loadFacilityDataFromStorage(): { [key: string]: ParkingFacilityInfo } | null {
    try {
      const stored = localStorage.getItem(ParkingApiService.FACILITY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ 로컬 스토리지 데이터 로드 실패:', error);
    }
    return null;
  }

  // PrkRealtimeInfo와 저장된 데이터 매칭 및 점유율 계산
  async matchRealtimeWithStoredData(): Promise<void> {
    console.log('🔄 실시간 데이터와 저장된 데이터 매칭 시작...');
    
    // 저장된 시설 데이터 로드
    const storedFacilities = this.loadFacilityDataFromStorage();
    if (!storedFacilities) {
      console.warn('⚠️ 저장된 시설 데이터가 없습니다. saveFacilityDataToStorage()를 먼저 실행하세요.');
      return;
    }

    console.log(`📦 저장된 시설 데이터: ${Object.keys(storedFacilities).length}개`);

    try {
      // 실시간 데이터 조회
      const realtimeData = await this.getParkingRealtimeInfo();
      console.log(`⏱️ 실시간 데이터: ${realtimeData.length}개`);

      let matchCount = 0;
      const matchedResults: Array<{
        facility: ParkingFacilityInfo;
        realtime: ParkingRealtimeInfo;
        occupied: number;
        occupancyRate: number;
      }> = [];

      // 실시간 데이터와 저장된 데이터 매칭
      realtimeData.forEach(realtime => {
        if (realtime.prk_center_id && storedFacilities[realtime.prk_center_id]) {
          const facility = storedFacilities[realtime.prk_center_id];
          
          // 점유 대수 계산: 총 대수 - 가용 대수
          const total = realtime.pkfc_ParkingLots_total || 0;
          const available = realtime.pkfc_Available_ParkingLots_total || 0;
          const occupied = Math.max(0, total - available);
          const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

          matchedResults.push({
            facility,
            realtime,
            occupied,
            occupancyRate: Math.round(occupancyRate * 100) / 100
          });

          matchCount++;
        }
      });

      console.log(`🎯 매칭 결과: ${matchCount}개 매칭 성공`);
      console.log('📊 매칭된 주차장 목록:');

      // 점유율 높은 순으로 정렬하여 출력
      matchedResults
        .sort((a, b) => b.occupancyRate - a.occupancyRate)
        .slice(0, 20) // 상위 20개만 출력
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.facility.prk_plce_nm}`);
          console.log(`   📍 주소: ${result.facility.prk_plce_adres}`);
          console.log(`   🚗 총 ${result.realtime.pkfc_ParkingLots_total}면 | 가용 ${result.realtime.pkfc_Available_ParkingLots_total}면 | 점유 ${result.occupied}면`);
          console.log(`   📊 점유율: ${result.occupancyRate}%`);
          console.log(`   🆔 센터ID: ${result.facility.prk_center_id}`);
          console.log('   ---');
        });

      // 통계 정보
      const avgOccupancyRate = matchedResults.reduce((sum, r) => sum + r.occupancyRate, 0) / matchedResults.length;
      const highOccupancy = matchedResults.filter(r => r.occupancyRate >= 80).length;
      const mediumOccupancy = matchedResults.filter(r => r.occupancyRate >= 50 && r.occupancyRate < 80).length;
      const lowOccupancy = matchedResults.filter(r => r.occupancyRate < 50).length;

      console.log('📈 점유율 통계:');
      console.log(`   평균 점유율: ${Math.round(avgOccupancyRate * 100) / 100}%`);
      console.log(`   🔴 혼잡 (80% 이상): ${highOccupancy}개`);
      console.log(`   🟡 보통 (50-80%): ${mediumOccupancy}개`);
      console.log(`   🟢 여유 (50% 미만): ${lowOccupancy}개`);

    } catch (error) {
      console.error('❌ 실시간 데이터 매칭 실패:', error);
    }
  }

  // 로컬 스토리지에 마커 데이터 저장 및 관리
  // PrkSttusInfo 데이터를 마커 형태로 로컬 스토리지에 저장
  async saveMarkersToLocalStorage(): Promise<void> {
    console.log('🗺️ PrkSttusInfo 데이터를 마커로 변환하여 로컬 스토리지에 저장...');
    
    try {
      const facilities = await this.getParkingFacilityInfo();
      console.log(`📊 총 ${facilities.length}개 시설 데이터 처리 중...`);

      // 마커 데이터로 변환
      const markerData = facilities
        .filter(facility => {
          // 유효한 좌표가 있는 데이터만 필터링
          return facility.prk_plce_entrc_la && 
                 facility.prk_plce_entrc_lo && 
                 facility.prk_plce_entrc_la > 0 && 
                 facility.prk_plce_entrc_lo > 0;
        })
        .map(facility => ({
          id: facility.prk_center_id,
          name: facility.prk_plce_nm,
          address: facility.prk_plce_adres,
          lat: facility.prk_plce_entrc_la,
          lng: facility.prk_plce_entrc_lo,
          capacity: facility.prk_cmprt_co,
          type: 'parking_facility',
          timestamp: Date.now()
        }));

      // 로컬 스토리지에 저장
      localStorage.setItem('parking_markers_data', JSON.stringify(markerData));
      
      console.log(`✅ ${markerData.length}개 마커 데이터 저장 완료`);
      console.log('📍 저장된 마커 샘플:', markerData.slice(0, 3));
      
    } catch (error) {
      console.error('❌ 마커 데이터 저장 실패:', error);
    }
  }

  // 로컬 스토리지에서 마커 데이터 로드
  loadMarkersFromLocalStorage(): Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    capacity: number;
    type: string;
    timestamp: number;
  }> {
    try {
      const stored = localStorage.getItem('parking_markers_data');
      if (stored) {
        const markers = JSON.parse(stored);
        console.log(`📦 로컬 스토리지에서 ${markers.length}개 마커 로드`);
        return markers;
      }
    } catch (error) {
      console.error('❌ 마커 데이터 로드 실패:', error);
    }
    return [];
  }

  // 마커들의 중심 좌표 계산
  calculateMarkersCenter(markers: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    if (markers.length === 0) {
      return { lat: 37.566826, lng: 126.9786567 }; // 서울 시청 기본 좌표
    }

    const totalLat = markers.reduce((sum, marker) => sum + marker.lat, 0);
    const totalLng = markers.reduce((sum, marker) => sum + marker.lng, 0);

    const centerLat = totalLat / markers.length;
    const centerLng = totalLng / markers.length;

    console.log(`📍 ${markers.length}개 마커의 중심 좌표:`, { lat: centerLat, lng: centerLng });
    
    return { lat: centerLat, lng: centerLng };
  }

  // 특정 지역의 마커만 필터링
  filterMarkersByRegion(markers: Array<any>, region?: string): Array<any> {
    if (!region) return markers;

    const filtered = markers.filter(marker => 
      marker.address && marker.address.includes(region)
    );

    console.log(`🔍 "${region}" 지역 필터링: ${markers.length}개 → ${filtered.length}개`);
    return filtered;
  }

  // 로컬 스토리지 마커 데이터 초기화
  clearMarkersFromLocalStorage(): void {
    localStorage.removeItem('parking_markers_data');
    console.log('🗑️ 로컬 스토리지 마커 데이터 초기화 완료');
  }

  // 새로운 키워드 기반 주차장 데이터 매칭 시스템
  // 1단계: 키워드와 sido 비교하여 매칭된 데이터 저장
  async saveMatchingParkingData(keyword: string): Promise<void> {
    console.log(`🔍 1단계: 키워드 "${keyword}"와 sido 매칭 시작...`);
    
    if (!this.serviceKey) {
      console.error('❌ API 키가 설정되지 않았습니다.');
      return;
    }

    try {
      // PrkSttusInfo 전체 데이터 조회
      const facilities = await this.getParkingFacilityInfo();
      console.log(`📊 전체 시설 데이터: ${facilities.length}개`);

      // 키워드와 sido가 일치하는 데이터 필터링
      const matchingFacilities = facilities.filter(facility => {
        const sido = facility.prk_plce_adres_sido || '';
        return sido.toLowerCase().includes(keyword.toLowerCase()) || 
               keyword.toLowerCase().includes(sido.toLowerCase());
      });

      console.log(`🎯 키워드 "${keyword}"와 매칭된 시설: ${matchingFacilities.length}개`);

      // 로컬 스토리지에 저장할 데이터 구조
      const storageData = matchingFacilities.map(facility => ({
        prk_plce_adres_sido: facility.prk_plce_adres_sido,
        prk_center_id: facility.prk_center_id,
        prk_plce_entrc_la: facility.prk_plce_entrc_la,
        prk_plce_entrc_lo: facility.prk_plce_entrc_lo,
        prk_plce_nm: facility.prk_plce_nm,
        // 실시간 데이터는 나중에 추가
        pkfc_ParkingLots_total: null,
        pkfc_Available_ParkingLots_total: null,
        matchedKeyword: keyword,
        timestamp: Date.now()
      }));

      // 로컬 스토리지에 저장
      localStorage.setItem(ParkingApiService.KEYWORD_STORAGE_KEY, JSON.stringify(storageData));

      console.log('✅ 1단계 완료: 매칭된 데이터 로컬 스토리지 저장');
      console.log('📋 저장된 데이터 샘플:', storageData.slice(0, 3));
      console.log(`💾 총 ${storageData.length}개 데이터 저장`);

    } catch (error) {
      console.error('❌ 1단계 실패:', error);
    }
  }

  // 2단계: 실시간 데이터와 매칭하여 업데이트
  async updateWithRealtimeData(): Promise<void> {
    console.log('🔄 2단계: 실시간 데이터 매칭 시작...');

    try {
      // 로컬 스토리지에서 저장된 데이터 로드
      const storedData = this.loadKeywordMatchingData();
      if (!storedData || storedData.length === 0) {
        console.warn('⚠️ 저장된 데이터가 없습니다. 1단계를 먼저 실행하세요.');
        return;
      }

      console.log(`📦 저장된 데이터: ${storedData.length}개`);

      // 실시간 데이터 조회
      const realtimeData = await this.getParkingRealtimeInfo();
      console.log(`⏱️ 실시간 데이터: ${realtimeData.length}개`);

      // prk_center_id로 매칭하여 업데이트
      let matchCount = 0;
      const updatedData = storedData.map(stored => {
        const realtimeMatch = realtimeData.find(rt => rt.prk_center_id === stored.prk_center_id);
        
        if (realtimeMatch) {
          matchCount++;
          return {
            ...stored,
            pkfc_ParkingLots_total: realtimeMatch.pkfc_ParkingLots_total,
            pkfc_Available_ParkingLots_total: realtimeMatch.pkfc_Available_ParkingLots_total,
            realtimeUpdated: Date.now()
          };
        }
        
        return stored;
      });

      // 업데이트된 데이터를 로컬 스토리지에 다시 저장
      localStorage.setItem(ParkingApiService.KEYWORD_STORAGE_KEY, JSON.stringify(updatedData));

      console.log('✅ 2단계 완료: 실시간 데이터 매칭 및 업데이트');
      console.log(`🎯 매칭 성공: ${matchCount}개 / ${storedData.length}개`);

    } catch (error) {
      console.error('❌ 2단계 실패:', error);
    }
  }

  // 3단계: 저장된 값을 콘솔로 출력
  displayStoredData(): void {
    console.log('📋 3단계: 저장된 데이터 출력...');

    const storedData = this.loadKeywordMatchingData();
    if (!storedData || storedData.length === 0) {
      console.warn('⚠️ 출력할 데이터가 없습니다.');
      return;
    }

    console.log(`📊 총 ${storedData.length}개 데이터 출력:`);
    console.log('=' .repeat(80));

    storedData.forEach((data, index) => {
      console.log(`${index + 1}. ${data.prk_plce_nm}`);
      console.log(`   🏙️ 시도: ${data.prk_plce_adres_sido}`);
      console.log(`   🆔 센터ID: ${data.prk_center_id}`);
      console.log(`   📍 좌표: (${data.prk_plce_entrc_la}, ${data.prk_plce_entrc_lo})`);
      
      if (data.pkfc_ParkingLots_total !== null) {
        console.log(`   🚗 총 주차면: ${data.pkfc_ParkingLots_total}면`);
        console.log(`   🟢 가용 주차면: ${data.pkfc_Available_ParkingLots_total}면`);
        console.log(`   🔴 점유 주차면: ${(data.pkfc_ParkingLots_total || 0) - (data.pkfc_Available_ParkingLots_total || 0)}면`);
        
        const occupancyRate = data.pkfc_ParkingLots_total > 0 
          ? ((data.pkfc_ParkingLots_total - data.pkfc_Available_ParkingLots_total) / data.pkfc_ParkingLots_total * 100).toFixed(1)
          : 0;
        console.log(`   📊 점유율: ${occupancyRate}%`);
      } else {
        console.log(`   ⚠️ 실시간 데이터 없음`);
      }
      
      console.log(`   🔍 매칭 키워드: ${data.matchedKeyword}`);
      console.log('   ---');
    });

    console.log('=' .repeat(80));
    console.log('📈 요약 통계:');
    
    const withRealtime = storedData.filter(d => d.pkfc_ParkingLots_total !== null);
    const totalSpaces = withRealtime.reduce((sum, d) => sum + (d.pkfc_ParkingLots_total || 0), 0);
    const availableSpaces = withRealtime.reduce((sum, d) => sum + (d.pkfc_Available_ParkingLots_total || 0), 0);
    const occupiedSpaces = totalSpaces - availableSpaces;
    const avgOccupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces * 100).toFixed(1) : 0;

    console.log(`   📊 실시간 데이터 있음: ${withRealtime.length}개 / ${storedData.length}개`);
    console.log(`   🚗 전체 주차면 합계: ${totalSpaces}면`);
    console.log(`   🟢 전체 가용면 합계: ${availableSpaces}면`);
    console.log(`   🔴 전체 점유면 합계: ${occupiedSpaces}면`);
    console.log(`   📊 전체 평균 점유율: ${avgOccupancyRate}%`);
  }

  // 키워드 매칭 데이터 로드
  private loadKeywordMatchingData(): Array<{
    prk_plce_adres_sido: string;
    prk_center_id: string;
    prk_plce_entrc_la: number;
    prk_plce_entrc_lo: number;
    prk_plce_nm: string;
    pkfc_ParkingLots_total: number;
    pkfc_Available_ParkingLots_total: number;
    matchedKeyword: string;
    timestamp: number;
    realtimeUpdated?: number;
  }> | null {
    try {
      const stored = localStorage.getItem(ParkingApiService.KEYWORD_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ 키워드 매칭 데이터 로드 실패:', error);
    }
    return null;
  }

  // 키워드 매칭 데이터 초기화
  clearKeywordMatchingData(): void {
    localStorage.removeItem(ParkingApiService.KEYWORD_STORAGE_KEY);
    console.log('🗑️ 키워드 매칭 데이터 초기화 완료');
  }

  // 전체 프로세스 실행 (1단계 → 2단계 → 3단계)
  async executeFullProcess(keyword: string): Promise<void> {
    console.log(`🚀 전체 프로세스 시작: 키워드 "${keyword}"`);
    console.log('=' .repeat(80));
    
    // 1단계: 키워드 매칭 및 저장
    await this.saveMatchingParkingData(keyword);
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2단계: 실시간 데이터 매칭
    await this.updateWithRealtimeData();
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3단계: 결과 출력
    this.displayStoredData();
    
    console.log('🏁 전체 프로세스 완료!');
  }
}

export const parkingApiService = new ParkingApiService();