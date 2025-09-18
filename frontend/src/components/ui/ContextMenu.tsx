"use client";

import React from "react";
import type { ContextMenuState } from "@/types/marker";

interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  onCreateMarker: () => void;
  onClose: () => void;
}

export function ContextMenu({
  contextMenu,
  onCreateMarker,
  onClose,
}: ContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <>
      {/* 배경 클릭으로 메뉴 닫기 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* 컨텍스트 메뉴 */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]"
        style={{
          left: contextMenu.x,
          top: contextMenu.y,
        }}
      >
        <button
          type="button"
          onClick={onCreateMarker}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>마커 생성</span>
        </button>
      </div>
    </>
  );
}
