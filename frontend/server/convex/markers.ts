import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const markers = await ctx.db.query("markers").collect();
    
    // 각 마커에 대해 댓글 수를 계산 (commentCount와 likes는 이제 직접 저장됨)
    const markersWithCounts = await Promise.all(
      markers.map(async (marker: any) => {
        // 댓글 수만 계산 (commentCount는 직접 저장되지만 실시간 동기화를 위해)
        const actualCommentCount = await ctx.db
          .query("comments")
          .withIndex("by_marker", (q: any) => q.eq("markerId", marker._id))
          .collect()
          .then((comments: any[]) => comments.length);

        // 위치 데이터 처리 - 기존 데이터와 새 데이터 모두 지원
        const lat = marker.lat || marker.position?.lat || 37.566826;
        const lng = marker.lng || marker.position?.lng || 126.9786567;

        return {
          ...marker,
          // 위치 데이터 정규화
          lat,
          lng,
          position: { lat, lng },
          // 실제 댓글 수로 업데이트 (동기화)
          commentCount: actualCommentCount,
          // 날짜 데이터를 ISO 문자열로 변환
          createdAt: marker.createdAt 
            ? new Date(marker.createdAt).toISOString() 
            : new Date().toISOString(),
          updatedAt: marker.updatedAt 
            ? new Date(marker.updatedAt).toISOString() 
            : undefined,
          // 기본값 설정
          author: marker.author || '익명',
          viewCount: marker.viewCount || 0,
          likes: marker.likes || 0,
          images: marker.images || [],
        };
      })
    );

    return markersWithCounts;
  },
});

export const getById = query({
  args: { id: v.id("markers") },
  handler: async (ctx: any, args: { id: any }) => {
    const marker = await ctx.db.get(args.id);
    if (!marker) return null;

    // 댓글 수만 계산 (likes는 이제 마커에 직접 저장됨)
    let commentCount = 0;
    try {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_marker", (q: any) => q.eq("markerId", args.id))
        .collect();
      commentCount = comments.length;
    } catch (error) {
      console.warn('댓글 조회 실패, 기본값 0 사용:', error);
      commentCount = 0;
    }

    // 위치 데이터 처리 - 기존 데이터와 새 데이터 모두 지원
    const lat = marker.lat || marker.position?.lat || 37.566826;
    const lng = marker.lng || marker.position?.lng || 126.9786567;

    return {
      ...marker,
      // 위치 데이터 정규화
      lat,
      lng,
      position: { lat, lng },
      // 댓글 수 (실제 계산 또는 저장된 값)
      commentCount: commentCount || marker.commentCount || 0,
      // 좋아요 수 - 마커에 직접 저장된 값 사용 (기본값 0)
      likes: marker.likes || 0,
      // 날짜 데이터를 ISO 문자열로 변환
      createdAt: marker.createdAt 
        ? new Date(marker.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: marker.updatedAt 
        ? new Date(marker.updatedAt).toISOString() 
        : undefined,
      // 기본값 설정
      author: marker.author || '익명',
      viewCount: marker.viewCount || 0,
      images: marker.images || [],
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.optional(v.float64()), 
    lng: v.optional(v.float64()), 
    position: v.optional(v.object({ lat: v.float64(), lng: v.float64() })), 
    rating: v.optional(v.number()),
    author: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    congestionVotes: v.optional(v.object({
      available: v.number(),
      moderate: v.number(),
      crowded: v.number()
    })),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    
    // 위치 데이터 처리 - 여러 형태 지원
    const lat = args.lat || args.position?.lat || 37.566826; 
    const lng = args.lng || args.position?.lng || 126.9786567;
    
    const insertedId = await ctx.db.insert("markers", {
      name: args.name,
      category: args.category,
      description: args.description,
      address: args.address,
      lat,
      lng,
      position: { lat, lng }, 
      rating: args.rating,
      userId: userId || undefined,
      author: args.author || '익명',
      images: args.images || [],
      viewCount: 0,
      likes: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
      congestionVotes: args.congestionVotes,
    });
    return await ctx.db.get(insertedId);
  },
});

export const incrementViewCount = mutation({
  args: {
    markerId: v.id("markers"),
  },
  handler: async (ctx: any, args: any) => {
    const marker = await ctx.db.get(args.markerId);
    if (!marker) {
      throw new Error("마커를 찾을 수 없습니다.");
    }

    // 마커의 viewCount 직접 증가
    const currentViewCount = marker.viewCount || 0;
    await ctx.db.patch(args.markerId, {
      viewCount: currentViewCount + 1,
    });

    return currentViewCount + 1;
  },
});

// 좋아요 토글 - 단순화
export const toggleLike = mutation({
  args: {
    markerId: v.id("markers"),
    userId: v.optional(v.id("users")),
    userIdentifier: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const marker = await ctx.db.get(args.markerId);
    if (!marker) {
      throw new Error("마커를 찾을 수 없습니다.");
    }

    // 현재 좋아요 수
    const currentLikes = marker.likes || 0;
    
    // 좋아요 토글 (실제 사용자 추적 없이 단순 증감)
    // 실제 구현에서는 사용자별 좋아요 상태를 별도로 관리해야 함
    await ctx.db.patch(args.markerId, {
      likes: currentLikes + 1, // 임시로 증가만 구현
    });

    return { liked: true, count: currentLikes + 1 };
  },
});

// 댓글 관련 함수들
export const getComments = query({
  args: { markerId: v.id("markers") },
  handler: async (ctx: any, args: { markerId: any }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_marker", (q: any) => q.eq("markerId", args.markerId))
      .collect();

    return comments.map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: comment.updatedAt ? new Date(comment.updatedAt).toISOString() : undefined,
    }));
  },
});

export const addComment = mutation({
  args: {
    markerId: v.id("markers"),
    author: v.string(),
    content: v.string(),
    avatar: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    
    const commentId = await ctx.db.insert("comments", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    
    // 마커의 댓글 수 증가
    const marker = await ctx.db.get(args.markerId);
    if (marker) {
      await ctx.db.patch(args.markerId, {
        commentCount: (marker.commentCount || 0) + 1,
      });
    }
    
    return await ctx.db.get(commentId);
  },
});

export const update = mutation({
  args: {
    id: v.id("markers"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    rating: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }
    
    const marker = await ctx.db.get(args.id);
    if (!marker) {
      throw new Error("마커를 찾을 수 없습니다.");
    }
    
    if (marker.userId !== userId) {
      throw new Error("마커를 수정할 권한이 없습니다.");
    }
    
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.rating !== undefined) updateData.rating = args.rating;
    if (args.images !== undefined) updateData.images = args.images;
    
    if (args.lat !== undefined && args.lng !== undefined) {
      updateData.lat = args.lat;
      updateData.lng = args.lng;
      updateData.position = { lat: args.lat, lng: args.lng };
    }
    
    await ctx.db.patch(args.id, updateData);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("markers") },
  handler: async (ctx: any, args: { id: any }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }
    
    const marker = await ctx.db.get(args.id);
    if (!marker) {
      throw new Error("마커를 찾을 수 없습니다.");
    }
    
    if (marker.userId !== userId) {
      throw new Error("마커를 삭제할 권한이 없습니다.");
    }
    
    // 관련 댓글, 좋아요, 조회 기록도 함께 삭제
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_marker", (q: any) => q.eq("markerId", args.id))
      .collect();
      
    // 모든 관련 데이터 삭제
    await Promise.all([
      ...comments.map((comment: any) => ctx.db.delete(comment._id)),
    ]);
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});