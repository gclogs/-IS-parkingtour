// 혼잡도 데이터 저장 및 조회 서비스

import { type CongestionVotes, type CongestionStats, type CongestionLevel, type CongestionVoteRequest, type CongestionVoteResponse, congestionUtils } from '@/types/congestion';

// 로컬 스토리지 키
const CONGESTION_STORAGE_KEY = 'parking_congestion_data';

// 혼잡도 데이터 저장소 인터페이스
interface CongestionStorage {
  [markerId: string]: {
    votes: CongestionVotes;
    stats: CongestionStats;
    lastUpdated: number;
    userVotes: { [userId: string]: CongestionLevel }; // 사용자별 투표 기록
  };
}

class CongestionService {
  private storage: CongestionStorage = {};
  private isClient: boolean = false;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.loadFromLocalStorage();
    }
  }

  // 로컬 스토리지에서 데이터 로드
  private loadFromLocalStorage(): void {
    if (!this.isClient) return;
    
    try {
      const stored = localStorage.getItem(CONGESTION_STORAGE_KEY);
      if (stored) {
        this.storage = JSON.parse(stored);
      }
    } catch (error) {
      console.error('혼잡도 데이터 로드 실패:', error);
      this.storage = {};
    }
  }

  // 로컬 스토리지에 데이터 저장
  private saveToLocalStorage(): void {
    if (!this.isClient) return;
    
    try {
      localStorage.setItem(CONGESTION_STORAGE_KEY, JSON.stringify(this.storage));
    } catch (error) {
      console.error('혼잡도 데이터 저장 실패:', error);
    }
  }

  // 특정 마커의 혼잡도 데이터 조회
  getCongestionData(markerId: string): { votes: CongestionVotes; stats: CongestionStats } | null {
    const data = this.storage[markerId];
    if (!data) {
      return null;
    }

    return {
      votes: data.votes,
      stats: data.stats
    };
  }

  // 혼잡도 투표 처리
  async submitVote(request: CongestionVoteRequest): Promise<CongestionVoteResponse> {
    try {
      const { markerId, level, userId = 'anonymous' } = request;

      // 기존 데이터 가져오기 또는 초기화
      let markerData = this.storage[markerId];
      if (!markerData) {
        markerData = {
          votes: { available: 0, moderate: 0, crowded: 0 },
          stats: { totalVotes: 0, availablePercentage: 0, moderatePercentage: 0, crowdedPercentage: 0, dominantLevel: 'moderate' },
          lastUpdated: Date.now(),
          userVotes: {}
        };
        this.storage[markerId] = markerData;
      }

      // 사용자가 이미 투표했는지 확인
      const previousVote = markerData.userVotes[userId];
      
      // 이전 투표가 있다면 제거
      if (previousVote) {
        markerData.votes[previousVote] = Math.max(0, markerData.votes[previousVote] - 1);
      }

      // 새 투표 추가
      markerData.votes[level] += 1;
      markerData.userVotes[userId] = level;
      markerData.lastUpdated = Date.now();

      // 통계 재계산
      markerData.stats = congestionUtils.calculateStats(markerData.votes);

      // 로컬 스토리지에 저장
      this.saveToLocalStorage();

      return {
        success: true,
        votes: markerData.votes,
        stats: markerData.stats
      };

    } catch (error) {
      console.error('투표 처리 오류:', error);
      return {
        success: false,
        votes: { available: 0, moderate: 0, crowded: 0 },
        stats: { totalVotes: 0, availablePercentage: 0, moderatePercentage: 0, crowdedPercentage: 0, dominantLevel: 'moderate' }
      };
    }
  }

  // 사용자의 투표 기록 조회
  getUserVote(markerId: string, userId: string = 'anonymous'): CongestionLevel | null {
    const data = this.storage[markerId];
    return data?.userVotes[userId] || null;
  }

  // 모든 마커의 혼잡도 데이터 조회
  getAllCongestionData(): { [markerId: string]: { votes: CongestionVotes; stats: CongestionStats } } {
    const result: { [markerId: string]: { votes: CongestionVotes; stats: CongestionStats } } = {};
    
    for (const [markerId, data] of Object.entries(this.storage)) {
      result[markerId] = {
        votes: data.votes,
        stats: data.stats
      };
    }

    return result;
  }

  // 특정 마커의 혼잡도 데이터 초기화
  resetCongestionData(markerId: string): void {
    delete this.storage[markerId];
    this.saveToLocalStorage();
  }

  // 모든 혼잡도 데이터 초기화
  resetAllCongestionData(): void {
    this.storage = {};
    this.saveToLocalStorage();
  }

  // 오래된 데이터 정리 (7일 이상 된 데이터)
  cleanupOldData(): void {
    if (!this.isClient) return;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const [markerId, data] of Object.entries(this.storage)) {
      if (data.lastUpdated < sevenDaysAgo) {
        delete this.storage[markerId];
      }
    }

    this.saveToLocalStorage();
  }

  // 마커별 투표 통계 요약
  getCongestionSummary(): {
    totalMarkers: number;
    totalVotes: number;
    averageVotesPerMarker: number;
    dominantLevels: { [level in CongestionLevel]: number };
  } {
    const summary = {
      totalMarkers: 0,
      totalVotes: 0,
      averageVotesPerMarker: 0,
      dominantLevels: { available: 0, moderate: 0, crowded: 0 } as { [level in CongestionLevel]: number }
    };

    for (const data of Object.values(this.storage)) {
      summary.totalMarkers++;
      summary.totalVotes += data.stats.totalVotes;
      summary.dominantLevels[data.stats.dominantLevel]++;
    }

    summary.averageVotesPerMarker = summary.totalMarkers > 0 
      ? Math.round((summary.totalVotes / summary.totalMarkers) * 10) / 10 
      : 0;

    return summary;
  }
}

// 싱글톤 인스턴스 생성
export const congestionService = new CongestionService();

// 편의 함수들
export const getCongestionData = (markerId: string) => {
  const result = congestionService.getCongestionData(markerId);
  if (result) {
    return result;
  }
  // 기본값 반환
  return {
    votes: { available: 0, moderate: 0, crowded: 0 },
    stats: { totalVotes: 0, availablePercentage: 0, moderatePercentage: 0, crowdedPercentage: 0, dominantLevel: 'moderate' as CongestionLevel }
  };
};

export const submitCongestionVote = (markerId: string, level: CongestionLevel, userId?: string) => {
  return congestionService.submitVote({ markerId, level, userId });
};
export const getUserVote = (markerId: string, userId?: string) => congestionService.getUserVote(markerId, userId);
export const getAllCongestionData = () => congestionService.getAllCongestionData();
export const resetCongestionData = (markerId: string) => congestionService.resetCongestionData(markerId);

// 초기화 시 오래된 데이터 정리 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  congestionService.cleanupOldData();
}