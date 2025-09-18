"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convex, isConvexConfigured } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface MarkerData {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  rating?: number;
  images?: string[];
  author?: string;
  createdAt?: string;
}

interface Comment {
  _id: string;
  markerId: string;
  author: string;
  content: string;
  avatar?: string;
  _creationTime: number;
}

export default function MarkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const markerId = String(params.id);

  // 마커 데이터 조회 (Convex 전용)
  const {
    data: marker,
    isLoading: markerLoading,
    isError: markerError,
  } = useQuery<MarkerData | null>({
    queryKey: ["marker", markerId],
    queryFn: async () => {
      if (!isConvexConfigured) {
        throw new Error("Convex가 설정되지 않았습니다.");
      }

      try {
        const doc = await convex.query(api.markers.getById, { id: markerId as Id<"markers"> });
        if (doc) {
          return {
            id: doc._id as unknown as string,
            name: doc.name,
            category: doc.category,
            description: doc.description,
            address: doc.address,
            position: doc.position,
            rating: doc.rating,
            images: [],
            author: "서버 데이터",
            createdAt: new Date(doc._creationTime).toLocaleDateString("ko-KR"),
          } satisfies MarkerData;
        }
        return null;
      } catch (error) {
        console.error("마커 조회 실패:", error);
        throw error;
      }
    },
    staleTime: 30_000,
    enabled: !!markerId && isConvexConfigured,
  });

  // 댓글 조회 (마커별)
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery<Comment[]>({
    queryKey: ["comments", markerId],
    queryFn: async () => {
      if (!isConvexConfigured || !markerId) return [];

      try {
        const commentsData = await convex.query(api.comments.getByMarkerId, {
          markerId: markerId as Id<"markers">,
        });
        return commentsData || [];
      } catch (error) {
        console.error("댓글 조회 실패:", error);
        return [];
      }
    },
    staleTime: 10_000,
    enabled: !!markerId && isConvexConfigured,
  });

  // 댓글 추가 mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; author: string; avatar?: string }) => {
      if (!isConvexConfigured || !markerId) {
        throw new Error("Convex가 설정되지 않았거나 마커 ID가 없습니다.");
      }

      return await convex.mutation(api.comments.create, {
        markerId: markerId as Id<"markers">,
        author: commentData.author,
        content: commentData.content,
        avatar: commentData.avatar,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", markerId] });
      toast.success("댓글이 추가되었습니다! 💬");
      setNewComment("");
    },
    onError: (error) => {
      console.error("댓글 추가 실패:", error);
      toast.error("댓글 추가에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim()) {
      const avatars = ["👨", "👩", "🧑", "👤", "😊", "🙂", "😎", "🤓", "😄", "😃"];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      addCommentMutation.mutate({
        content: newComment.trim(),
        author: "익명 사용자",
        avatar: randomAvatar,
      });
    }
  };

  const handleNavigation = () => {
    if (marker) {
      const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(marker.name)},${marker.position.lat},${marker.position.lng}`;
      window.open(kakaoMapUrl, "_blank");
      toast.success("카카오맵으로 이동합니다! 🗺️");
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success("링크가 클립보드에 복사되었습니다! 🔗");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          toast.success("링크가 복사되었습니다! 🔗");
        } catch (err) {
          toast.error("복사에 실패했습니다. 다시 시도해주세요.");
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (markerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (markerError || !marker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">마커를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            {!isConvexConfigured 
              ? "Convex가 설정되지 않았습니다." 
              : "요청하신 마커 정보가 존재하지 않습니다."
            }
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">돌아가기</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 정보 카드 */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="text-center space-y-4">
                  <CardTitle className="text-4xl font-bold text-gray-900 leading-tight">
                    {marker.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                      {marker.category}
                    </span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* 설명 */}
                <div className="bg-gray-50/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></span>
                    설명
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{marker.description}</p>
                </div>

                {/* 위치 정보 */}
                <div className="bg-gray-50/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-teal-600 rounded-full mr-3"></span>
                    위치 정보
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-medium text-lg">{marker.address}</span>
                    </div>
                    <div className="text-sm text-gray-500 ml-13 space-y-1">
                      <p>위도: {marker.position.lat.toFixed(6)}</p>
                      <p>경도: {marker.position.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex flex-wrap gap-4 pt-6">
                  <button
                    onClick={handleNavigation}
                    className="flex-1 min-w-[140px] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    🗺️ 길찾기
                  </button>
                  <button className="flex-1 min-w-[140px] px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    ⭐ 즐겨찾기
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 min-w-[140px] px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    📤 공유하기
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 댓글 섹션 */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                  <span className="w-2 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full mr-3"></span>
                  댓글 ({commentsLoading ? "..." : comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 댓글 작성 */}
                <div className="bg-gray-50/50 rounded-xl p-4 space-y-3 sticky top-4 z-10">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="이 장소에 대한 의견을 남겨주세요..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    disabled={addCommentMutation.isPending}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {addCommentMutation.isPending ? "작성 중..." : "💬 댓글 작성"}
                  </button>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p>댓글을 불러오는 중...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-lg font-medium">아직 댓글이 없습니다</p>
                      <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {comments.map((comment, index) => (
                        <div
                          key={comment._id}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                              {comment.avatar || "👤"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-gray-800 truncate">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {new Date(comment._creationTime).toLocaleString("ko-KR")}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed break-words">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
