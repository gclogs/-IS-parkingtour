# ParkingTour 서비스 설계 문서

## 서비스 개요

실시간 주차/교통 정보와 사용자 생성 콘텐츠(UGC)를 결합한 지도 기반 플랫폼입니다. 공공 데이터와 사용자 행동 데이터를 활용해 자체 학습하는 추천 시스템을 구축합니다.

## 핵심 사용자 플로우

### 1. 회원가입 및 인증
- **OAuth 2.0 (Google 로그인)** 사용
- 개인정보 보호를 위한 **익명화 처리**:
  - 랜덤 닉네임 자동 생성 (예: "여행자1234", "탐험가5678")
  - 랜덤 아바타 이미지 할당
  - 실명/이메일은 백엔드에서만 관리, 프론트엔드에는 익명 정보만 노출

### 2. 마커 생성 플로우
1. 사용자가 지도에서 특정 위치 클릭
2. 마커 생성 폼 표시:
   - **이름**: 장소명 (필수)
   - **이유**: 추천 이유/설명 (필수)
   - **카테고리**: 음식점/관광지/주차장/기타 (필수)
   - **사진**: 최대 3장 업로드 (선택)
3. 저장 버튼 클릭 → Convex에 데이터 영구 저장
4. **실시간 동기화**: 다른 사용자 화면에 즉시 반영
5. **실시간 알림**: "OO님이 새로운 마커를 추가했습니다" 토스트 표시

### 3. 검색 및 정보 제공
- 사용자가 장소명 검색 (예: "전주 한옥마을")
- 검색 결과 주변의 **공영주차장 정보** 표시:
  - 실시간 가용률 (공공 API 연동)
  - 주차 요금 정보
  - 도보 시간 계산
  - 사용자 평점/리뷰

### 4. 데이터 수집 및 학습 루프
- **행동 로그 수집**: 검색어, 클릭, 체류시간, 이탈률
- **피드백 수집**: 추천 결과 채택/무시, 신고, 별점
- **특성 추출**: 요일, 시간대, 날씨, 지역 행사, 학기 여부
- **품질 점수화**: 마커별 댓글/투표 수 → 잠재 명소 발굴

---

## 백엔드 아키텍처 (Convex)

### 데이터 모델

#### 사용자 관리
```typescript
// profiles 테이블
{
  _id: Id<"profiles">,
  googleId: string,           // OAuth 식별자
  email: string,              // 실제 이메일 (비공개)
  anonymousName: string,      // 랜덤 닉네임
  avatarUrl: string,          // 랜덤 아바타 URL
  createdAt: number,
  preferences: {
    notifications: boolean,
    dataCollection: boolean   // 데이터 수집 동의 여부
  }
}
```

#### 마커 및 콘텐츠
```typescript
// markers 테이블
{
  _id: Id<"markers">,
  authorId: Id<"profiles">,
  location: { lat: number, lng: number },
  name: string,
  reason: string,
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

#### 공공 데이터 캐시
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

#### 행동 로그 및 학습 데이터
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

### 백엔드 함수 (Convex Functions)

#### 인증 및 사용자 관리
- `auth.ts`: Google OAuth 처리, 익명 프로필 생성
- `profiles.ts`: 사용자 프로필 CRUD, 개인정보 보호 처리

#### 마커 및 콘텐츠 관리
- `markers.ts`: 마커 CRUD, 실시간 동기화
- `comments.ts`: 댓글 시스템
- `votes.ts`: 투표 시스템
- `uploads.ts`: 이미지 업로드 처리 (Convex File Storage)

#### 공공 데이터 연동
- `parking_sync.ts`: 주차장 API 주기적 호출 (크론 작업)
- `traffic_sync.ts`: 교통 정보 API 연동
- `cache_manager.ts`: 데이터 캐시 관리, Fallback 처리

#### 검색 및 추천
- `search.ts`: 장소 검색, 주변 시설 조회
- `recommendations.ts`: 사용자 행동 기반 추천 알고리즘
- `analytics.ts`: 행동 로그 집계, 특성 추출

#### 스케줄링 (Cron Jobs)
- 공공 API 데이터 수집: 30초~5분 주기
- 사용자 행동 로그 집계: 1시간 주기
- 추천 모델 업데이트: 일 단위

### 개인정보 보호 및 보안
- **최소 수집 원칙**: 서비스 필수 데이터만 수집
- **익명화 처리**: 실명/이메일과 행동 데이터 분리
- **동의 관리**: 데이터 수집/활용 동의 체크박스
- **데이터 보존**: 사용자 탈퇴 시 개인 식별 정보 즉시 삭제
- **API 키 보호**: 공공 API 키는 서버 환경변수로만 관리

---

## 프론트엔드 아키텍처 (Next.js + React)

### 주요 페이지 구조

#### 인증 페이지
- `/auth/login`: Google OAuth 로그인 버튼
- `/auth/callback`: OAuth 콜백 처리
- `/auth/setup`: 초기 익명 프로필 설정 (닉네임/아바타 확인)

#### 메인 지도 페이지
- `/`: 메인 지도 화면 (Leaflet/Mapbox GL)
- 실시간 마커 표시
- 검색 바 (장소명 자동완성)
- 마커 클릭 시 상세 정보 팝업

#### 마커 관리
- `/markers/create`: 새 마커 생성 폼 (모달 또는 사이드 패널)
- `/markers/[id]`: 마커 상세 페이지 (댓글, 투표, 사진)
- `/markers/[id]/edit`: 마커 수정 (작성자만)

#### 사용자 페이지
- `/profile`: 내 프로필 (익명 정보만 표시)
- `/profile/settings`: 알림/개인정보 설정
- `/profile/my-markers`: 내가 작성한 마커 목록

### 주요 컴포넌트

#### 지도 관련 (`src/features/map/`)
```typescript
// MapContainer.tsx - 메인 지도 컨테이너
// MarkerLayer.tsx - 마커 렌더링 레이어
// SearchBox.tsx - 장소 검색 입력
// MarkerPopup.tsx - 마커 클릭 시 팝업
// CreateMarkerModal.tsx - 새 마커 생성 모달
```

#### 인증 관련 (`src/features/auth/`)
```typescript
// LoginButton.tsx - Google 로그인 버튼
// AuthGuard.tsx - 인증 상태 확인 HOC
// ProfileSetup.tsx - 초기 프로필 설정
```

#### 마커 관련 (`src/features/markers/`)
```typescript
// MarkerForm.tsx - 마커 생성/수정 폼
// MarkerCard.tsx - 마커 정보 카드
// CommentSection.tsx - 댓글 영역
// VoteButtons.tsx - 좋아요/싫어요 버튼
// PhotoUpload.tsx - 사진 업로드 컴포넌트
```

#### 검색 및 추천 (`src/features/search/`)
```typescript
// SearchResults.tsx - 검색 결과 목록
// ParkingInfo.tsx - 주차장 정보 표시
// RecommendationList.tsx - 추천 장소 목록
```

### 상태 관리 (Redux Toolkit)

#### 슬라이스 구조
```typescript
// authSlice.ts - 사용자 인증 상태
// mapSlice.ts - 지도 상태 (중심점, 줌 레벨)
// markersSlice.ts - 마커 데이터 캐시
// searchSlice.ts - 검색 상태 및 결과
// notificationsSlice.ts - 실시간 알림
```

### 실시간 기능
- **Convex 구독**: 마커 생성/수정 시 실시간 업데이트
- **토스트 알림**: 새 마커 추가 시 다른 사용자에게 알림
- **WebSocket 연결**: Convex의 실시간 쿼리 활용

### UI/UX 고려사항
- **반응형 디자인**: 모바일 우선 설계
- **접근성**: 키보드 네비게이션, 스크린 리더 지원
- **성능 최적화**: 지도 마커 클러스터링, 이미지 lazy loading
- **오프라인 지원**: 캐시된 데이터로 기본 기능 제공

### 개인정보 보호 UI
- **동의 관리**: 초기 가입 시 데이터 수집 동의 체크박스
- **익명성 강조**: 실명 대신 랜덤 닉네임만 표시
- **투명성**: 개인정보 처리방침 링크, 데이터 사용 현황 표시
- **제어권**: 설정에서 데이터 수집 on/off 토글

---

## 학습 및 추천 시스템

### 데이터 수집 전략
1. **명시적 피드백**: 별점, 좋아요, 신고
2. **암시적 피드백**: 클릭률, 체류시간, 재방문
3. **컨텍스트 정보**: 시간대, 요일, 날씨, 지역 이벤트

### 특성 엔지니어링
- **시간적 특성**: 평일/주말, 시간대, 계절
- **공간적 특성**: 지역, 교통 접근성, 주변 시설
- **사회적 특성**: 인기도, 최신성, 사용자 평점

### 추천 알고리즘
1. **협업 필터링**: 유사한 사용자의 선호도 기반
2. **콘텐츠 기반**: 마커 카테고리/태그 유사성
3. **하이브리드**: 위 두 방식의 가중 평균
4. **실시간 조정**: 현재 시간/날씨/이벤트 반영

### 품질 관리
- **스팸 탐지**: 중복 마커, 부적절한 콘텐츠 자동 필터링
- **신뢰도 점수**: 사용자별 기여도 및 신뢰성 평가
- **커뮤니티 모더레이션**: 신고 시스템, 사용자 투표 기반 검증

---

## 개발 우선순위

### Phase 1: MVP (4-6주)
1. Google OAuth 인증 시스템
2. 기본 지도 + 마커 CRUD
3. 실시간 동기화 (Convex)
4. 간단한 검색 기능

### Phase 2: 공공 데이터 연동 (2-3주)
1. 주차장 API 연동 및 캐시
2. 검색 결과에 주차 정보 표시
3. 크론 작업으로 데이터 주기 업데이트

### Phase 3: 사용자 경험 개선 (3-4주)
1. 댓글/투표 시스템
2. 사진 업로드 기능
3. 실시간 알림 시스템
4. 모바일 최적화

### Phase 4: 학습 시스템 (4-5주)
1. 사용자 행동 로그 수집
2. 기본 추천 알고리즘 구현
3. A/B 테스트 프레임워크
4. 분석 대시보드

### Phase 5: 고도화 (지속적)
1. 고급 추천 알고리즘
2. 머신러닝 모델 도입
3. 성능 최적화
4. 확장성 개선