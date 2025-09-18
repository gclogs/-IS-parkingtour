"use client";

import React, { useState, useMemo } from "react";
import type { MarkerData } from "@/types/marker";
import { PostItem } from "./PostItem";

interface PostListProps {
  posts: MarkerData[];
  onPostClick: (post: MarkerData) => void;
  loading?: boolean;
  error?: string | null;
}

// 카테고리 필터 옵션
const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체', emoji: '📋' },
  { value: 'restaurant', label: '음식점', emoji: '🍽️' },
  { value: 'cafe', label: '카페', emoji: '☕' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { value: 'entertainment', label: '엔터테인먼트', emoji: '🎮' },
  { value: 'parking', label: '주차장', emoji: '🅿️' },
  { value: 'gas_station', label: '주유소', emoji: '⛽' },
  { value: 'hospital', label: '병원', emoji: '🏥' },
  { value: 'school', label: '학교', emoji: '🏫' },
  { value: 'park', label: '공원', emoji: '🌳' },
  { value: 'tourist', label: '관광지', emoji: '🏛️' },
  { value: 'other', label: '기타', emoji: '📍' }
];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'popular', label: '인기순' },
  { value: 'comments', label: '댓글많은순' }
];

export function PostList({ posts, onPostClick, loading = false, error = null }: PostListProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // 필터링 및 정렬된 게시글 목록
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.name.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.address.toLowerCase().includes(query)
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'popular':
          return (b.likes || 0) - (a.likes || 0);
        case 'comments':
          return (b.commentCount || 0) - (a.commentCount || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [posts, selectedCategory, sortBy, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-700 font-medium mb-2">데이터를 불러오는데 실패했습니다</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">장소 게시판</h1>
        <p className="text-gray-600">다양한 장소 정보를 공유하고 확인해보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색바 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="장소명, 설명, 주소로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 결과 카운트 */}
        <div className="mt-3 text-sm text-gray-600">
          총 {filteredAndSortedPosts.length}개의 게시글
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {filteredAndSortedPosts.length > 0 ? (
          filteredAndSortedPosts.map(post => (
            <PostItem
              key={post.id}
              post={post}
              onClick={onPostClick}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">게시글이 없습니다</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all' 
                ? '검색 조건에 맞는 게시글이 없습니다. 다른 조건으로 검색해보세요.'
                : '아직 등록된 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostList;
