# ParkingTour 백엔드 (Convex)

ParkingTour의 백엔드는 **Convex**를 사용하여 실시간 데이터 동기화, 사용자 인증, 공공 데이터 연동, 그리고 자체 학습 추천 시스템을 구현합니다.

## 🏗️ 아키텍처 개요

- **실시간 데이터베이스**: Convex의 실시간 쿼리로 마커/댓글/투표 즉시 동기화
- **인증 시스템**: Google OAuth + 익명화 처리
- **공공 데이터 연동**: 주차/교통 API 주기적 수집 및 캐시
- **학습 시스템**: 사용자 행동 로그 → 특성 추출 → 추천 알고리즘
- **스케줄링**: 크론 작업으로 데이터 수집/집계 자동화

## 📊 데이터 모델

### 사용자 관리
```typescript
// profiles 테이블
{
  _id: Id<"profiles">,
  googleId: string,           // OAuth 식별자
  email: string,              // 실제 이메일 (비공개)
  anonymousName: string,      // 랜덤 닉네임 (예: "여행자1234")
  avatarUrl: string,          // 랜덤 아바타 URL
  createdAt: number,
  preferences: {
    notifications: boolean,
    dataCollection: boolean   // 데이터 수집 동의 여부
  }
}
```

### 마커 및 콘텐츠
```typescript
// markers 테이블
{
  _id: Id<"markers">,
  authorId: Id<"profiles">,
  location: { lat: number, lng: number },
  name: string,               // 장소명
  reason: string,             // 추천 이유
  category: "restaurant" | "tourist" | "parking" | "other",
  photos: string[],           // 업로드된 사진 URL 배열
  createdAt: number,
  updatedAt: number,
  status: "active" | "reported" | "hidden"
}

// comments 테이블
{
  _id: Id<"comments">,
  markerId: Id<"markers">,
  authorId: Id<"profiles">,
  content: string,
  createdAt: number
}

// votes 테이블 (좋아요/싫어요)
{
  _id: Id<"votes">,
  markerId: Id<"markers">,
  userId: Id<"profiles">,
  type: "up" | "down",
  createdAt: number
}
```

### 공공 데이터 캐시
```typescript
// parking_data 테이블
{
  _id: Id<"parking_data">,
  facilityId: string,         // 공공 API 시설 ID
  name: string,
  location: { lat: number, lng: number },
  totalSpaces: number,
  availableSpaces: number,
  hourlyRate: number,
  lastUpdated: number,
  source: "seoul_api" | "busan_api" | "manual"
}
```

### 행동 로그 및 학습 데이터
```typescript
// user_actions 테이블
{
  _id: Id<"user_actions">,
  userId: Id<"profiles">,     // 익명화된 사용자 ID
  sessionId: string,          // 세션 추적용
  action: "search" | "click" | "view" | "exit",
  target: string,             // 검색어 또는 마커 ID
  timestamp: number,
  metadata: {
    duration?: number,        // 체류 시간
    location?: { lat: number, lng: number }
  }
}

// feedback 테이블
{
  _id: Id<"feedback">,
  userId: Id<"profiles">,
  type: "recommendation_accept" | "recommendation_ignore" | "report" | "rating",
  targetId: string,           // 마커 ID 또는 추천 ID
  value: number | string,     // 별점 또는 신고 사유
  createdAt: number
}
```

## 🔧 핵심 함수 (Convex Functions)

### 인증 및 사용자 관리
- **`auth.ts`**: Google OAuth 처리, 익명 프로필 생성
- **`profiles.ts`**: 사용자 프로필 CRUD, 개인정보 보호 처리

### 마커 및 콘텐츠 관리
- **`markers.ts`**: 마커 CRUD, 실시간 동기화
- **`comments.ts`**: 댓글 시스템
- **`votes.ts`**: 투표 시스템
- **`uploads.ts`**: 이미지 업로드 처리 (Convex File Storage)

### 공공 데이터 연동
- **`parking_sync.ts`**: 주차장 API 주기적 호출 (크론 작업)
- **`traffic_sync.ts`**: 교통 정보 API 연동
- **`cache_manager.ts`**: 데이터 캐시 관리, Fallback 처리

### 검색 및 추천
- **`search.ts`**: 장소 검색, 주변 시설 조회
- **`recommendations.ts`**: 사용자 행동 기반 추천 알고리즘
- **`analytics.ts`**: 행동 로그 집계, 특성 추출

## ⏰ 스케줄링 (Cron Jobs)

### 데이터 수집
```typescript
// 공공 API 데이터 수집: 30초~5분 주기
export const syncParkingData = internalAction({
  handler: async (ctx) => {
    // 서울시 주차장 API 호출
    // 부산시 주차장 API 호출
    // 캐시에 저장
  }
});

// 사용자 행동 로그 집계: 1시간 주기
export const aggregateUserActions = internalAction({
  handler: async (ctx) => {
    // 최근 1시간 행동 로그 집계
    // 특성 추출 (시간대, 요일, 지역별 패턴)
    // 추천 가중치 업데이트
  }
});

// 추천 모델 업데이트: 일 단위
export const updateRecommendationModel = internalAction({
  handler: async (ctx) => {
    // 협업 필터링 매트릭스 업데이트
    // 콘텐츠 기반 유사도 계산
    // 하이브리드 모델 가중치 조정
  }
});
```

## 🔐 개인정보 보호 및 보안

### 익명화 처리
- **실명/이메일 분리**: 백엔드에서만 관리, 프론트엔드에는 익명 정보만 전송
- **랜덤 닉네임**: "여행자1234", "탐험가5678" 형태로 자동 생성
- **세션 기반 추적**: 개인 식별 없이 행동 패턴만 수집

### 데이터 보호
- **최소 수집 원칙**: 서비스 필수 데이터만 수집
- **동의 관리**: 데이터 수집/활용 동의 체크박스
- **안전한 삭제**: 사용자 탈퇴 시 개인 식별 정보 즉시 삭제
- **API 키 보호**: 공공 API 키는 서버 환경변수로만 관리

### 보안 조치
```typescript
// 환경변수 예시
SEOUL_PARKING_API_KEY=your_seoul_api_key
BUSAN_PARKING_API_KEY=your_busan_api_key
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_secret
CONVEX_DEPLOY_KEY=your_convex_key
```

## 🤖 학습 및 추천 시스템

### 데이터 수집 전략
1. **명시적 피드백**: 별점, 좋아요, 신고
2. **암시적 피드백**: 클릭률, 체류시간, 재방문
3. **컨텍스트 정보**: 시간대, 요일, 날씨, 지역 이벤트

### 특성 엔지니어링
```typescript
// 시간적 특성
const timeFeatures = {
  hour: new Date().getHours(),
  dayOfWeek: new Date().getDay(),
  isWeekend: [0, 6].includes(new Date().getDay()),
  season: getSeason(new Date())
};

// 공간적 특성
const locationFeatures = {
  region: getRegion(lat, lng),
  nearbyTransport: getNearbyTransport(lat, lng),
  populationDensity: getPopulationDensity(lat, lng)
};

// 사회적 특성
const socialFeatures = {
  popularity: getMarkerPopularity(markerId),
  recency: getMarkerRecency(markerId),
  userRating: getAverageRating(markerId)
};
```

### 추천 알고리즘
1. **협업 필터링**: 유사한 사용자의 선호도 기반
2. **콘텐츠 기반**: 마커 카테고리/태그 유사성
3. **하이브리드**: 위 두 방식의 가중 평균
4. **실시간 조정**: 현재 시간/날씨/이벤트 반영

### 품질 관리
- **스팸 탐지**: 중복 마커, 부적절한 콘텐츠 자동 필터링
- **신뢰도 점수**: 사용자별 기여도 및 신뢰성 평가
- **커뮤니티 모더레이션**: 신고 시스템, 사용자 투표 기반 검증

## 🚀 개발 환경 설정

### 1. Convex 프로젝트 초기화
```bash
# Convex CLI 설치
npm install -g convex

# 프로젝트 초기화
cd convex
npx convex dev
```

### 2. 환경변수 설정
```bash
# .env.local 파일 생성
SEOUL_PARKING_API_KEY=your_api_key
BUSAN_PARKING_API_KEY=your_api_key
GOOGLE_OAUTH_CLIENT_SECRET=your_secret
```

### 3. 스키마 정의
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    googleId: v.string(),
    email: v.string(),
    anonymousName: v.string(),
    avatarUrl: v.string(),
    preferences: v.object({
      notifications: v.boolean(),
      dataCollection: v.boolean()
    })
  }),
  
  markers: defineTable({
    authorId: v.id("profiles"),
    location: v.object({ lat: v.number(), lng: v.number() }),
    name: v.string(),
    reason: v.string(),
    category: v.union(v.literal("restaurant"), v.literal("tourist"), v.literal("parking"), v.literal("other")),
    photos: v.array(v.string()),
    status: v.union(v.literal("active"), v.literal("reported"), v.literal("hidden"))
  })
});
```

### 4. 크론 작업 설정
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 5분마다 주차장 데이터 동기화
crons.interval("sync parking data", { minutes: 5 }, internal.parking_sync.syncParkingData);

// 1시간마다 사용자 행동 로그 집계
crons.interval("aggregate user actions", { hours: 1 }, internal.analytics.aggregateUserActions);

// 매일 자정에 추천 모델 업데이트
crons.daily("update recommendation model", { hourUTC: 0, minuteUTC: 0 }, internal.recommendations.updateModel);

export default crons;
```

## 📈 모니터링 및 로깅

### 성능 모니터링
- **쿼리 성능**: Convex 대시보드에서 실시간 모니터링
- **API 응답 시간**: 공공 API 호출 지연 추적
- **캐시 히트율**: 데이터 캐시 효율성 측정

### 에러 처리
```typescript
// 공공 API 호출 시 에러 처리
export const syncParkingData = internalAction({
  handler: async (ctx) => {
    try {
      const data = await fetchParkingAPI();
      await ctx.runMutation(internal.parking.updateCache, { data });
    } catch (error) {
      console.error("Parking API sync failed:", error);
      // Fallback: 최근 캐시 데이터 유지
    }
  }
});
```

## 🔄 배포 및 운영

### 배포 프로세스
```bash
# 프로덕션 배포
npx convex deploy --prod

# 환경변수 설정
npx convex env set SEOUL_PARKING_API_KEY your_key --prod
```

### 백업 및 복구
- **자동 백업**: Convex의 자동 백업 기능 활용
- **데이터 마이그레이션**: 스키마 변경 시 마이그레이션 스크립트 작성

### 확장성 고려사항
- **샤딩**: 지역별 데이터 분산 저장
- **캐싱**: Redis 등 외부 캐시 레이어 추가 고려
- **로드 밸런싱**: Convex의 자동 스케일링 활용

---

## 📚 참고 자료

- [Convex 공식 문서](https://docs.convex.dev/)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [서울시 주차장 API](https://data.seoul.go.kr/)
- [개인정보보호법 가이드라인](https://www.privacy.go.kr/)