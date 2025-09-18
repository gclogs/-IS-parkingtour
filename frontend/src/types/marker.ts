import type { CongestionVotes, CongestionStats } from './congestion';

// 애플리케이션에서 사용하는 마커 데이터 타입
export interface AppMarker {
  id: number;
  name: string;
  category: string;
  description: string;
  position: { lat: number; lng: number };
  address: string;
  rating?: number;
}

// 공통 마커 데이터 인터페이스 (게시판 기능 포함)
export interface MarkerData {
  id: number;
  name: string;
  category: string;
  description: string;
  position: { lat: number; lng: number };
  address: string;
  rating?: number; // 평점 속성 추가
  serverId?: string; // Convex 문서 ID (있는 경우)
  congestionVotes?: CongestionVotes; // 혼잡도 투표 정보
  congestionStats?: CongestionStats; // 혼잡도 통계 정보
  
  // 게시판 기능을 위한 추가 필드들
  images?: string[]; // 이미지 URL 배열
  commentCount?: number; // 댓글 수
  createdAt?: string; // 생성 시간 (ISO 문자열)
  updatedAt?: string; // 수정 시간 (ISO 문자열)
  author?: string; // 작성자
  viewCount?: number; // 조회수
  likes?: number; // 좋아요 수
}

export interface MarkerFormData {
  name: string;
  category: string;
  description: string;
  rating: number;
}

// 컨텍스트 메뉴 상태
export interface ContextMenuState {
  x: number;
  y: number;
}

// react-kakao-maps-sdk와의 호환성을 위한 타입 별칭
export type { AppMarker as Marker };