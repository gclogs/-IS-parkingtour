"use client";

import React from "react";
import type { MarkerData } from "@/types/marker";

interface PostItemProps {
  post: MarkerData;
  onClick: (post: MarkerData) => void;
}

// 카테고리별 이모지 매핑
const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'restaurant': '🍽️',
    'cafe': '☕',
    'shopping': '🛍️',
    'entertainment': '🎮',
    'parking': '🅿️',
    'gas_station': '⛽',
    'hospital': '🏥',
    'school': '🏫',
    'park': '🌳',
    'tourist': '🏛️',
    'other': '📍'
  };
  return emojiMap[category] || '📍';
};

// 시간 포맷팅 함수
const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return '시간 정보 없음';
  
  try {
    const now = new Date();
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '시간 정보 없음';
    }
    
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '시간 정보 없음';
  }
};

export function PostItem({ post, onClick }: PostItemProps) {
  const handleClick = () => {
    onClick(post);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
    >
      <div className="flex gap-4">
        {/* 왼쪽: 미리보기 이미지 */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          {post.images && post.images.length > 0 ? (
            <img
              src={post.images[0]}
              alt={post.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml;base64,${btoa(`
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="80" fill="#f3f4f6"/>
                    <text x="40" y="45" text-anchor="middle" font-size="24">${getCategoryEmoji(post.category)}</text>
                  </svg>
                `)}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">
              {getCategoryEmoji(post.category)}
            </div>
          )}
        </div>

        {/* 중간: 제목과 댓글 수 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
            {post.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span>💬 {post.commentCount || 0}</span>
            </div>
            {post.viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <span>👁️ {post.viewCount}</span>
              </div>
            )}
            {post.likes !== undefined && (
              <div className="flex items-center gap-1">
                <span>❤️ {post.likes}</span>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 카테고리와 업로드 시간 */}
        <div className="flex-shrink-0 text-right">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
            <span className="mr-1">{getCategoryEmoji(post.category)}</span>
            {post.category}
          </div>
          <div className="text-xs text-gray-500">
            {formatTimeAgo(post.createdAt)}
          </div>
          {post.author && (
            <div className="text-xs text-gray-400 mt-1">
              by {post.author}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostItem;
