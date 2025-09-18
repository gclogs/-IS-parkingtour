import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Convex schema for markers, comments, likes, views, and authentication
export default defineSchema({
  ...authTables,
  
  markers: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.optional(v.float64()), // 기존 데이터 호환성을 위해 optional로 변경
    lng: v.optional(v.float64()), // 기존 데이터 호환성을 위해 optional로 변경
    position: v.optional(v.object({ lat: v.float64(), lng: v.float64() })), // 호환성 유지
    rating: v.optional(v.number()),
    userId: v.optional(v.id("users")), // 마커 생성자 ID
    author: v.optional(v.string()), // 작성자 이름
    images: v.optional(v.array(v.string())), // 이미지 URL 배열
    viewCount: v.optional(v.number()), // 조회수
    createdAt: v.optional(v.number()), // 생성 시간 (timestamp)
    updatedAt: v.optional(v.number()), // 수정 시간 (timestamp)
    congestionVotes: v.optional(v.object({
      available: v.number(),
      moderate: v.number(),
      crowded: v.number()
    })),
    commentCount: v.optional(v.number()), // 댓글 수
    likes: v.optional(v.number()), // 좋아요 수
  }).index("by_category", ["category"])
    .index("by_name", ["name"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),
  
  comments: defineTable({
    markerId: v.id("markers"), // 마커 ID 참조
    author: v.string(), // 작성자 이름
    content: v.string(), // 댓글 내용
    avatar: v.optional(v.string()), // 아바타 이모지
    userId: v.optional(v.id("users")), // 댓글 작성자 ID
    createdAt: v.optional(v.number()), // 댓글 생성 시간 (timestamp)
    updatedAt: v.optional(v.number()), // 댓글 수정 시간 (timestamp)
  }).index("by_marker", ["markerId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
});