"use client";

import type React from "react";
import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface CreateMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    category: string; 
    description: string; 
    rating: number;
    congestionVotes?: { available: number; moderate: number; crowded: number };
  }) => void;
  defaultCategory?: string; // 기본 카테고리 설정 (주차장 페이지용)
  fixedCategory?: boolean; // 카테고리 고정 여부
}

export function CreateMarkerModal({
  isOpen,
  onClose,
  onSubmit,
  defaultCategory = "",
  fixedCategory = false,
}: CreateMarkerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: defaultCategory,
    description: "",
    rating: 5,
    congestionVotes: {
      available: 0,
      moderate: 0,
      crowded: 0,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.category) {
      onSubmit(formData);
      setFormData({ 
        name: "", 
        category: defaultCategory, 
        description: "", 
        rating: 5,
        congestionVotes: {
          available: 0,
          moderate: 0,
          crowded: 0,
        },
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 마커 생성" size="md">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyPress}>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">마커 이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
                placeholder="장소 이름을 입력하세요"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
              {fixedCategory ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700">
                  🅿️ 주차장 (고정)
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
                  required
                >
                  <option value="">카테고리를 선택하세요</option>
                  <option value="restaurant">🍽️ 음식점</option>
                  <option value="cafe">☕ 카페</option>
                  <option value="shopping">🛍️ 쇼핑</option>
                  <option value="entertainment">🎮 엔터테인먼트</option>
                  <option value="parking">🅿️ 주차장</option>
                  <option value="gas_station">⛽ 주유소</option>
                  <option value="hospital">🏥 병원</option>
                  <option value="school">🏫 학교</option>
                  <option value="park">🌳 공원</option>
                  <option value="tourist">🏛️ 관광지</option>
                  <option value="other">📍 기타</option>
                </select>
              )}
            </div>

            {/* 주차장 카테고리 선택 시 혼잡도 필터 옵션 표시 */}
            {formData.category === "parking" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🚗 혼잡도 초기 투표 (선택사항)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">🟢</span>
                      <span className="text-sm font-medium">여유</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={formData.congestionVotes.available}
                      onChange={(e) => setFormData({
                        ...formData,
                        congestionVotes: {
                          ...formData.congestionVotes,
                          available: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">🟡</span>
                      <span className="text-sm font-medium">보통</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={formData.congestionVotes.moderate}
                      onChange={(e) => setFormData({
                        ...formData,
                        congestionVotes: {
                          ...formData.congestionVotes,
                          moderate: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">🔴</span>
                      <span className="text-sm font-medium">혼잡</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={formData.congestionVotes.crowded}
                      onChange={(e) => setFormData({
                        ...formData,
                        congestionVotes: {
                          ...formData.congestionVotes,
                          crowded: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 초기 투표 수를 설정하면 마커 생성 시 해당 혼잡도 데이터가 반영됩니다.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all resize-none"
                placeholder="장소에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-2xl transition-colors ${
                      star <= formData.rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400`}
                  >
                    ⭐
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">{formData.rating}/5</span>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              생성하기 (Ctrl+Enter)
            </button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
