import type React from "react";
import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const handleSearch = () => {
    // 검색 로직 구현 (추후 확장 가능)
    console.log("검색어:", searchQuery);
    console.log("선택된 카테고리:", selectedCategory);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white shadow-xl border-r border-gray-200 z-40 overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">장소 검색</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 검색 콘텐츠 */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* 검색 입력창 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="장소를 검색해보세요..."
            className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리</h3>
          <div className="flex flex-wrap gap-2">
            {["전체", "주차장", "카페", "음식점", "관광지", "쇼핑몰"].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 text-sm rounded-full transition-colors font-medium ${
                  selectedCategory === category
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
        >
          검색하기
        </button>
      </div>
    </div>
  );
}