"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { convex, isConvexConfigured } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { MarkerData } from '@/types/marker';

// 게시판 컴포넌트 import
import { PostList } from "@/components/ui/PostList";
import { CreateMarkerFAB } from "@/components/ui/CreateMarkerFAB";
import { CreateMarkerModal } from "@/components/ui/CreateMarkerModal";

function HomePageContent() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [posts, setPosts] = useState<MarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isConvexConfigured) {
        setError("Convex가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const markersData = await convex.query(api.markers.list);
        
        // Convex 데이터를 MarkerData 형식으로 변환 (게시판용)
        const transformedPosts: MarkerData[] = markersData.map((marker: any, index: number) => ({
          id: marker._id,
          name: marker.name,
          category: marker.category,
          description: marker.description,
          address: marker.address,
          rating: marker.rating,
          position: {
            lat: marker.lat || marker.position?.lat || 37.566826,
            lng: marker.lng || marker.position?.lng || 126.9786567
          },
          congestionVotes: marker.congestionVotes,
          congestionStats: marker.congestionStats,
          // 게시판 기능을 위한 데이터 (Convex에서 직접 가져오기)
          images: marker.images || [],
          commentCount: marker.commentCount || 0, // Convex 함수에서 계산된 값
          createdAt: marker.createdAt || new Date().toISOString(), // Convex에서 ISO 문자열로 변환됨
          updatedAt: marker.updatedAt || marker.createdAt,
          author: marker.author || '익명',
          viewCount: marker.viewCount || 0,
          likes: marker.likes || 0 // Convex 함수에서 계산된 좋아요 수
        }));
        
        setPosts(transformedPosts);
      } catch (err) {
        console.error("게시글 데이터 로드 실패:", err);
        setError("게시글 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);


  // 게시글 클릭 핸들러 - 직접 세부정보 페이지로 이동
  const handlePostClick = useCallback((post: MarkerData) => {
    router.push(`/detail/information/${post.id}`);
  }, [router]);


  // 게시글 생성 제출 핸들러
  const handleCreatePostSubmit = useCallback(async (data: { 
    name: string; 
    category: string; 
    description: string; 
    rating: number;
    congestionVotes?: { available: number; moderate: number; crowded: number };
  }) => {
    if (!isConvexConfigured) return;

    try {
      const newPost = await convex.mutation(api.markers.create, {
        name: data.name,
        category: data.category,
        description: data.description,
        lat: 37.566826, // 기본 위치 (서울시청)
        lng: 126.9786567,
        rating: data.rating,
        address: "주소 정보 없음",
        congestionVotes: data.congestionVotes,
      });

      // 게시글 목록 업데이트
      const transformedNewPost: MarkerData = {
        id: newPost._id,
        name: newPost.name,
        category: newPost.category,
        description: newPost.description,
        address: newPost.address,
        rating: newPost.rating,
        position: {
          lat: newPost.lat,
          lng: newPost.lng
        },
        congestionVotes: newPost.congestionVotes,
        congestionStats: newPost.congestionStats,
        images: [],
        commentCount: 0,
        createdAt: new Date().toISOString(),
        author: '익명',
        viewCount: 0,
        likes: 0
      };
      
      setPosts(prev => [transformedNewPost, ...prev]);
      setIsCreateModalOpen(false);
      
      toast.success("게시글이 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("게시글 생성 실패:", error);
      toast.error("게시글 생성에 실패했습니다.");
    }
  }, []);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* 게시판 메인 콘텐츠 */}
      <PostList
        posts={posts}
        onPostClick={handlePostClick}
        loading={isLoading}
        error={error}
      />

      {/* 게시글 생성 FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <CreateMarkerFAB onClick={() => setIsCreateModalOpen(true)} />
      </div>

      {/* 게시글 생성 모달 */}
      <CreateMarkerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePostSubmit}
      />

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
