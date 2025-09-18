// 혼잡도 관련 타입 정의

// 혼잡도 레벨 타입
export type CongestionLevel = 'available' | 'moderate' | 'crowded';

// 혼잡도 투표 데이터 타입
export interface CongestionVotes {
  available: number;  // 여유 투표 수
  moderate: number;   // 보통 투표 수
  crowded: number;    // 혼잡 투표 수
}

// 혼잡도 통계 타입
export interface CongestionStats {
  totalVotes: number;
  availablePercentage: number;
  moderatePercentage: number;
  crowdedPercentage: number;
  dominantLevel: CongestionLevel;
}

// 혼잡도 투표 요청 타입
export interface CongestionVoteRequest {
  markerId: string;
  level: CongestionLevel;
  userId?: string;
}

// 혼잡도 투표 응답 타입
export interface CongestionVoteResponse {
  success: boolean;
  votes: CongestionVotes;
  stats: CongestionStats;
  error?: string;
}

// 주차장 마커에 혼잡도 정보를 포함한 확장 타입
export interface ParkingMarkerWithCongestion {
  id: string;
  name: string;
  category: string;
  description: string;
  position: { lat: number; lng: number };
  address: string;
  rating?: number;
  congestionVotes: CongestionVotes;
  congestionStats: CongestionStats;
  createdAt?: number;
  updatedAt?: number;
}

// 혼잡도 레벨별 스타일 정의
export interface CongestionLevelStyle {
  color: string;
  backgroundColor: string;
  icon: string;
  label: string;
  description: string;
}

// 혼잡도 레벨별 스타일 맵
export const CONGESTION_LEVEL_STYLES: Record<CongestionLevel, CongestionLevelStyle> = {
  available: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
    icon: '🟢',
    label: '여유',
    description: '주차 공간이 충분합니다'
  },
  moderate: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    icon: '🟡',
    label: '보통',
    description: '주차 공간이 적당합니다'
  },
  crowded: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    icon: '🔴',
    label: '혼잡',
    description: '주차 공간이 부족합니다'
  }
};

// 혼잡도 계산 유틸리티 함수들
export const congestionUtils = {
  // 투표 수를 기반으로 통계 계산
  calculateStats: (votes: CongestionVotes): CongestionStats => {
    const totalVotes = votes.available + votes.moderate + votes.crowded;
    
    if (totalVotes === 0) {
      return {
        totalVotes: 0,
        availablePercentage: 0,
        moderatePercentage: 0,
        crowdedPercentage: 0,
        dominantLevel: 'moderate'
      };
    }

    const availablePercentage = (votes.available / totalVotes) * 100;
    const moderatePercentage = (votes.moderate / totalVotes) * 100;
    const crowdedPercentage = (votes.crowded / totalVotes) * 100;

    // 가장 높은 투표 수를 가진 레벨 결정
    let dominantLevel: CongestionLevel = 'moderate';
    if (votes.available >= votes.moderate && votes.available >= votes.crowded) {
      dominantLevel = 'available';
    } else if (votes.crowded >= votes.moderate && votes.crowded >= votes.available) {
      dominantLevel = 'crowded';
    }

    return {
      totalVotes,
      availablePercentage: Math.round(availablePercentage * 10) / 10,
      moderatePercentage: Math.round(moderatePercentage * 10) / 10,
      crowdedPercentage: Math.round(crowdedPercentage * 10) / 10,
      dominantLevel
    };
  },

  // 혼잡도 레벨에 따른 스타일 가져오기
  getStyleForLevel: (level: CongestionLevel): CongestionLevelStyle => {
    return CONGESTION_LEVEL_STYLES[level];
  },

  // 투표 수가 가장 많은 레벨 반환
  getDominantLevel: (votes: CongestionVotes): CongestionLevel => {
    if (votes.available >= votes.moderate && votes.available >= votes.crowded) {
      return 'available';
    } else if (votes.crowded >= votes.moderate && votes.crowded >= votes.available) {
      return 'crowded';
    }
    return 'moderate';
  },

  // 혼잡도 레벨에 따른 CSS 클래스 반환
  getColorClass: (level: CongestionLevel): string => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      crowded: 'bg-red-100 text-red-800'
    };
    return styles[level];
  },

  // 혼잡도 레벨에 따른 텍스트 반환
  getLevelText: (level: CongestionLevel): string => {
    const texts = {
      available: '여유',
      moderate: '보통',
      crowded: '혼잡'
    };
    return texts[level];
  }
};