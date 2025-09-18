---
description: When working on frontend tasks, you need to review the .gitkeep summary before proceeding.
folders: frontend/src/*.gitkeep
---

## 🎨 기술 스택

- **프레임워크**: Next.js 14 (App Router, TypeScript)
- **지도**: React Leaflet (OpenStreetMap 기반)
- **상태관리**: Zustand (가벼운 상태 관리)
- **스타일링**: Tailwind CSS + Headless UI
- **인증**: Google OAuth 2.0 (NextAuth.js)
- **실시간**: Convex 실시간 쿼리
- **HTTP 클라이언트**: Axios
- **애니메이션**: Framer Motion
- **아이콘**: Heroicons + Lucide React
- **폼 관리**: React Hook Form + Zod
- **빌드/배포**: Vercel

### 🎯 디자인 철학
- **미니멀리즘**: 불필요한 요소 제거, 핵심 기능에 집중
- **일관성**: 모든 컴포넌트에서 동일한 디자인 언어 사용
- **접근성**: 모든 사용자가 쉽게 사용할 수 있는 인터페이스
- **성능**: 빠른 로딩과 부드러운 인터랙션

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃 (Redux Provider)
│   ├── page.tsx           # 메인 지도 페이지
│   ├── auth/              # 인증 관련 페이지
│   ├── markers/           # 마커 관련 페이지
│   └── profile/           # 사용자 프로필 페이지
├── components/            # 공통 UI 컴포넌트
│   ├── ui/               # 기본 UI 요소 (Button, Modal, Input)
│   └── layout/           # 레이아웃 컴포넌트
├── features/             # 기능별 모듈
│   ├── auth/             # 인증 관련 컴포넌트/훅
│   ├── map/              # 지도 관련 컴포넌트
│   ├── markers/          # 마커 관련 컴포넌트
│   └── search/           # 검색 관련 컴포넌트
├── hooks/                # 전역 커스텀 훅
├── services/             # API 서비스
├── store/                # Redux 상태 관리
├── utils/                # 유틸리티 함수
├── styles/               # 전역 스타일
└── assets/               # 정적 자산
```

## 🗺️ 주요 페이지

### 🏠 메인 지도 페이지 (`/`)
- **깔끔한 전체화면 지도**: 불필요한 UI 요소 최소화
- **플로팅 검색바**: 상단에 고정된 검색 인터페이스
- **마커 클러스터링**: 줌 레벨에 따른 지능적 마커 그룹화
- **사이드 패널**: 선택된 마커 정보 표시 (슬라이드 인/아웃)
- **플로팅 액션 버튼**: 새 마커 추가 (우하단 고정)

```typescript
// app/page.tsx - 메인 지도 페이지
export default function HomePage() {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* 상단 검색바 */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar />
      </div>
      
      {/* 메인 지도 */}
      <MapContainer className="h-full w-full" />
      
      {/* 마커 정보 사이드 패널 */}
      <MarkerInfoPanel />
      
      {/* 플로팅 액션 버튼 */}
      <div className="absolute bottom-6 right-6 z-10">
        <CreateMarkerFAB />
      </div>
    </div>
  );
}
```

### 🔐 인증 페이지
- **`/auth/login`**: 미니멀한 로그인 화면
  - 중앙 정렬된 로그인 카드
  - Google OAuth 버튼 하나만 표시
  - 브랜드 로고와 간단한 설명

- **`/auth/setup`**: 초기 프로필 설정
  - 단계별 온보딩 (3단계)
  - 익명 닉네임 생성 및 확인
  - 아바타 선택 (미리 정의된 옵션)
  - 개인정보 처리 동의

```typescript
// app/auth/login/page.tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <MapIcon className="h-12 w-12 text-blue-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">ParkingTour</h1>
            <p className="text-gray-600">지도로 발견하는 새로운 장소들</p>
          </div>
          
          <GoogleLoginButton />
          
          <p className="text-xs text-gray-500">
            로그인하면 <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </Card>
    </div>
  );
}
```

### 📍 마커 관리
- **`/markers/create`**: 새 마커 생성 (모달 또는 전체 페이지)
  - 단계별 폼 (위치 → 정보 → 사진)
  - 실시간 미리보기
  - 드래그 앤 드롭 사진 업로드

- **`/markers/[id]`**: 마커 상세 페이지
  - 이미지 갤러리 (스와이프 가능)
  - 댓글 시스템
  - 좋아요/북마크 기능
  - 공유 기능

### 👤 사용자 페이지
- **`/profile`**: 미니멀한 프로필 페이지
  - 익명 정보만 표시
  - 내 활동 통계 (마커 수, 좋아요 받은 수)
  - 최근 활동 타임라인

- **`/profile/settings`**: 설정 페이지
  - 알림 설정 토글
  - 개인정보 관리
  - 계정 삭제 옵션

## 🧩 주요 컴포넌트

### 지도 관련 (`src/features/map/`)
```typescript
// MapContainer.tsx - 메인 지도 컨테이너
export function MapContainer() {
  const markers = useAppSelector(selectAllMarkers);
  const dispatch = useAppDispatch();
  
  return (
    <MapContainer center={[37.5665, 126.9780]} zoom={13}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerLayer markers={markers} />
      <SearchBox onSearch={handleSearch} />
    </MapContainer>
  );
}

// MarkerLayer.tsx - 마커 렌더링 레이어
// SearchBox.tsx - 장소 검색 입력
// MarkerPopup.tsx - 마커 클릭 시 팝업
// CreateMarkerModal.tsx - 새 마커 생성 모달
```

### 인증 관련 (`src/features/auth/`)
```typescript
// LoginButton.tsx - Google 로그인 버튼
export function LoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };
  
  return (
    <button onClick={handleLogin} className="login-btn">
      <GoogleIcon />
      Google로 로그인
    </button>
  );
}

// AuthGuard.tsx - 인증 상태 확인 HOC
// ProfileSetup.tsx - 초기 프로필 설정
```

### 마커 관련 (`src/features/markers/`)
```typescript
// MarkerForm.tsx - 마커 생성/수정 폼
export function MarkerForm({ onSubmit, initialData }: MarkerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    category: 'restaurant' as MarkerCategory,
    photos: [] as File[]
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Input label="장소명" value={formData.name} onChange={handleNameChange} />
      <Textarea label="추천 이유" value={formData.reason} onChange={handleReasonChange} />
      <Select label="카테고리" value={formData.category} onChange={handleCategoryChange}>
        <option value="restaurant">음식점</option>
        <option value="tourist">관광지</option>
        <option value="parking">주차장</option>
        <option value="other">기타</option>
      </Select>
      <PhotoUpload photos={formData.photos} onChange={handlePhotosChange} />
      <Button type="submit">저장</Button>
    </form>
  );
}

// MarkerCard.tsx - 마커 정보 카드
// CommentSection.tsx - 댓글 영역
// VoteButtons.tsx - 좋아요/싫어요 버튼
// PhotoUpload.tsx - 사진 업로드 컴포넌트
```

### 검색 및 추천 (`src/features/search/`)
```typescript
// SearchResults.tsx - 검색 결과 목록
// ParkingInfo.tsx - 주차장 정보 표시
// RecommendationList.tsx - 추천 장소 목록
```

## 🔄 상태 관리 (Redux Toolkit)

### 슬라이스 구조
```typescript
// store/authSlice.ts - 사용자 인증 상태
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// store/mapSlice.ts - 지도 상태
interface MapState {
  center: [number, number];
  zoom: number;
  selectedMarker: string | null;
}

// store/markersSlice.ts - 마커 데이터 캐시
interface MarkersState {
  markers: Marker[];
  loading: boolean;
  error: string | null;
}

// store/searchSlice.ts - 검색 상태 및 결과
interface SearchState {
  query: string;
  results: SearchResult[];
  parkingInfo: ParkingInfo[];
  isSearching: boolean;
}

// store/notificationsSlice.ts - 실시간 알림
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}
```

### 스토어 설정
```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import mapSlice from './mapSlice';
import markersSlice from './markersSlice';
import searchSlice from './searchSlice';
import notificationsSlice from './notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    map: mapSlice,
    markers: markersSlice,
    search: searchSlice,
    notifications: notificationsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 🔗 실시간 기능 (Convex 연동)

### 실시간 쿼리
```typescript
// hooks/useMarkers.ts
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useMarkers() {
  const markers = useQuery(api.markers.getAll);
  return markers ?? [];
}

// hooks/useRealtimeNotifications.ts
export function useRealtimeNotifications() {
  const notifications = useQuery(api.notifications.getUnread);
  
  useEffect(() => {
    if (notifications?.length > 0) {
      notifications.forEach(notification => {
        toast.info(`${notification.message}`);
      });
    }
  }, [notifications]);
}
```

### 실시간 동기화
```typescript
// components/RealtimeSync.tsx
export function RealtimeSync() {
  const dispatch = useAppDispatch();
  const markers = useQuery(api.markers.getAll);
  
  useEffect(() => {
    if (markers) {
      dispatch(markersSlice.actions.setMarkers(markers));
    }
  }, [markers, dispatch]);
  
  return null;
}
```

## 🎨 UI/UX 디자인

### 🎯 사용자 경험 (UX) 원칙

#### 1. 직관적인 네비게이션
- **원클릭 접근**: 주요 기능은 최대 2번의 클릭으로 접근 가능
- **명확한 시각적 계층**: 중요도에 따른 정보 배치
- **일관된 인터랙션**: 동일한 동작은 항상 같은 방식으로 작동

```typescript
// components/navigation/MainNavigation.tsx
export function MainNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 - 홈으로 이동 */}
          <Link href="/" className="flex items-center space-x-2">
            <MapIcon className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">ParkingTour</span>
          </Link>
          
          {/* 주요 액션 버튼들 */}
          <div className="flex items-center space-x-4">
            <SearchButton />
            <CreateMarkerButton />
            <NotificationButton />
            <UserMenuButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

#### 2. 즉시 피드백 시스템
- **로딩 상태**: 모든 비동기 작업에 시각적 피드백
- **성공/실패 알림**: 사용자 행동에 대한 명확한 결과 표시
- **실시간 업데이트**: 변경사항 즉시 반영

```typescript
// hooks/useFeedback.ts
export function useFeedback() {
  const [toast] = useToast();
  
  const showSuccess = (message: string) => {
    toast({
      title: "성공",
      description: message,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  const showError = (message: string) => {
    toast({
      title: "오류",
      description: message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };
  
  const showLoading = (message: string = "처리 중...") => {
    return toast({
      title: message,
      status: "loading",
      duration: null,
    });
  };
  
  return { showSuccess, showError, showLoading };
}
```

#### 3. 모바일 우선 설계
- **터치 친화적**: 최소 44px 터치 타겟
- **스와이프 제스처**: 직관적인 모바일 인터랙션
- **단순화된 인터페이스**: 모바일에서 핵심 기능 우선

```typescript
// components/mobile/MobileOptimized.tsx
export function MobileOptimized({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={cn(
      "min-h-screen",
      isMobile ? "pb-20" : "pb-8" // 모바일에서 하단 네비게이션 공간 확보
    )}>
      {children}
      {isMobile && <MobileBottomNavigation />}
    </div>
  );
}

// 모바일 하단 네비게이션
function MobileBottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        <NavButton icon={MapIcon} label="지도" href="/" />
        <NavButton icon={SearchIcon} label="검색" href="/search" />
        <NavButton icon={PlusIcon} label="추가" href="/markers/create" />
        <NavButton icon={UserIcon} label="프로필" href="/profile" />
      </div>
    </div>
  );
}
```

### 🎨 시각적 디자인 시스템

#### 1. 컬러 팔레트
```scss
// styles/colors.scss
:root {
  /* Primary Colors - 브랜드 컬러 */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  
  /* Neutral Colors - 텍스트 및 배경 */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  
  /* Semantic Colors - 상태 표시 */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
  
  /* Map Colors - 지도 관련 */
  --color-marker-restaurant: #ef4444;
  --color-marker-tourist: #8b5cf6;
  --color-marker-parking: #10b981;
  --color-marker-other: #6b7280;
}
```

#### 2. 타이포그래피
```scss
// styles/typography.scss
.text-display {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.text-heading {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

.text-body {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-gray-500);
}
```

#### 3. 간격 시스템
```scss
// styles/spacing.scss
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

### 🧩 컴포넌트 디자인

#### 1. 버튼 시스템
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading,
  icon,
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={cn(baseClasses, variants[variant], sizes[size])}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
```

#### 2. 카드 컴포넌트
```typescript
// components/ui/Card.tsx
export function Card({ 
  children, 
  className,
  hover = false,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 shadow-sm",
      hover && "hover:shadow-md transition-shadow duration-200",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}
```

#### 3. 입력 필드
```typescript
// components/ui/Input.tsx
export function Input({ 
  label, 
  error, 
  helper,
  icon,
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
            icon && "pl-10",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500"
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}
```

### 📱 반응형 디자인
```scss
// styles/responsive.scss
$breakpoints: (
  mobile: 480px,
  tablet: 768px,
  desktop: 1024px,
  wide: 1200px
);

@mixin mobile {
  @media (max-width: map-get($breakpoints, mobile)) {
    @content;
  }
}

@mixin tablet {
  @media (max-width: map-get($breakpoints, tablet)) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: map-get($breakpoints, desktop)) {
    @content;
  }
}

// 반응형 그리드 시스템
.grid-responsive {
  display: grid;
  gap: 1rem;
  
  @include mobile {
    grid-template-columns: 1fr;
  }
  
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### ♿ 접근성 (Accessibility)

#### 1. 키보드 네비게이션
```typescript
// hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 키로 모달 닫기
      if (event.key === 'Escape') {
        closeModal();
      }
      
      // Tab 키로 포커스 관리
      if (event.key === 'Tab') {
        handleTabNavigation(event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

#### 2. 스크린 리더 지원
```typescript
// components/ui/AccessibleButton.tsx
export function AccessibleButton({ 
  children, 
  ariaLabel,
  ariaDescribedBy,
  ...props 
}: AccessibleButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      {...props}
    >
      {children}
    </button>
  );
}
```

#### 3. 색상 대비 및 시각적 표시
```scss
// styles/accessibility.scss
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// 고대비 모드 지원
@media (prefers-contrast: high) {
  :root {
    --color-primary-500: #0066cc;
    --color-gray-700: #000000;
    --border-width: 2px;
  }
}
```

### 🎭 애니메이션 및 인터랙션

#### 1. 마이크로 인터랙션
```typescript
// components/animations/FadeIn.tsx
export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}

// components/animations/SlideIn.tsx
export function SlideIn({ children, direction = 'left' }: SlideInProps) {
  const variants = {
    left: { x: -20 },
    right: { x: 20 },
    up: { y: 20 },
    down: { y: -20 }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, ...variants[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

#### 2. 로딩 상태
```typescript
// components/ui/LoadingStates.tsx
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded h-4 w-1/2"></div>
      </div>
    </div>
  );
}

export function SpinnerOverlay({ message = "로딩 중..." }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
        <Spinner className="h-5 w-5" />
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  );
}
```

## 📱 모바일 최적화

### 터치 인터페이스
```typescript
// hooks/useTouch.ts
export function useTouch() {
  const [touchStart, setTouchStart] = useState<TouchEvent | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchEvent | null>(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e);
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    setTouchEnd(e);
    handleSwipe();
  };
  
  return { handleTouchStart, handleTouchEnd };
}
```

### PWA 지원
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // Next.js 설정
});
```

## 🔐 개인정보 보호 UI

### 동의 관리
```typescript
// components/ConsentManager.tsx
export function ConsentManager() {
  const [consents, setConsents] = useState({
    dataCollection: false,
    notifications: false,
    analytics: false
  });
  
  return (
    <div className="consent-manager">
      <h3>개인정보 수집 및 이용 동의</h3>
      <label>
        <input
          type="checkbox"
          checked={consents.dataCollection}
          onChange={handleDataCollectionChange}
        />
        서비스 개선을 위한 사용 데이터 수집에 동의합니다
      </label>
      {/* 기타 동의 항목들 */}
    </div>
  );
}
```

### 익명성 강조
```typescript
// components/UserProfile.tsx
export function UserProfile({ user }: { user: User }) {
  return (
    <div className="user-profile">
      <img src={user.avatarUrl} alt="아바타" />
      <span className="anonymous-name">{user.anonymousName}</span>
      <span className="privacy-note">
        개인정보 보호를 위해 익명으로 표시됩니다
      </span>
    </div>
  );
}
```

## 🚀 개발 환경 설정

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 환경변수 설정
```bash
# .env.local 파일 생성
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 서버 실행
npm start

# Vercel 배포
vercel --prod
```

## 🧪 테스트

### 단위 테스트 (Jest + RTL)
```typescript
// tests/components/MarkerForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkerForm } from '@/features/markers/MarkerForm';

describe('MarkerForm', () => {
  it('should render form fields', () => {
    render(<MarkerForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('장소명')).toBeInTheDocument();
    expect(screen.getByLabelText('추천 이유')).toBeInTheDocument();
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument();
  });
  
  it('should call onSubmit with form data', () => {
    const mockSubmit = jest.fn();
    render(<MarkerForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('장소명'), {
      target: { value: '테스트 장소' }
    });
    fireEvent.click(screen.getByText('저장'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      name: '테스트 장소',
      // ...
    });
  });
});
```

### E2E 테스트 (Playwright)
```typescript
// tests/e2e/marker-creation.spec.ts
import { test, expect } from '@playwright/test';

test('사용자가 새 마커를 생성할 수 있다', async ({ page }) => {
  await page.goto('/');
  
  // 로그인
  await page.click('[data-testid="login-button"]');
  
  // 지도에서 위치 클릭
  await page.click('[data-testid="map-container"]');
  
  // 마커 생성 폼 작성
  await page.fill('[data-testid="marker-name"]', '테스트 장소');
  await page.fill('[data-testid="marker-reason"]', '테스트 이유');
  await page.selectOption('[data-testid="marker-category"]', 'restaurant');
  
  // 저장
  await page.click('[data-testid="save-marker"]');
  
  // 마커가 지도에 표시되는지 확인
  await expect(page.locator('[data-testid="marker"]')).toBeVisible();
});
```

## 📊 성능 최적화

### 이미지 최적화
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      {...props}
    />
  );
}
```

### 코드 분할
```typescript
// 동적 임포트로 번들 크기 최적화
const MapContainer = dynamic(() => import('@/features/map/MapContainer'), {
  ssr: false,
  loading: () => <div>지도 로딩 중...</div>
});
```

### 메모이제이션
```typescript
// hooks/useMemoizedMarkers.ts
export function useMemoizedMarkers() {
  const markers = useAppSelector(selectAllMarkers);
  const visibleMarkers = useMemo(() => {
    return markers.filter(marker => marker.status === 'active');
  }, [markers]);
  
  return visibleMarkers;
}
```

## 🔧 개발 도구

### ESLint 설정
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier 설정
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React Leaflet 가이드](https://react-leaflet.js.org/)
- [Redux Toolkit 문서](https://redux-toolkit.js.org/)
- [Convex React 가이드](https://docs.convex.dev/client/react)
- [Vercel 배포 가이드](https://vercel.com/docs)