"use client";

import React from "react";

interface CreateMarkerFABProps {
  onClick: () => void;
}

export function CreateMarkerFAB({ onClick }: CreateMarkerFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-14 h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-blue-200"
      title="새 마커 생성"
    >
      <svg
        className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
