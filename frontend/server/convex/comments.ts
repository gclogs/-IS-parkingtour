import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByMarkerId = query({
  args: { markerId: v.id("markers") },
  handler: async (ctx: any, args: { markerId: any }) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_marker", (q: any) => q.eq("markerId", args.markerId))
      .collect();
  },
});

export const create = mutation({
  args: {
    markerId: v.id("markers"),
    author: v.string(),
    content: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    // 임시로 인증 체크를 비활성화 (테스트용)
    // if (!userId) {
    //   throw new Error("로그인이 필요합니다.");
    // }
    
    const insertedId = await ctx.db.insert("comments", {
      ...args,
      userId: userId || undefined, // 스키마에 맞게 undefined로 처리
    });
    return await ctx.db.get(insertedId);
  },
});

export const update = mutation({
  args: {
    id: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }
    
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }
    
    if (comment.userId !== userId) {
      throw new Error("댓글을 수정할 권한이 없습니다.");
    }
    
    await ctx.db.patch(args.id, { content: args.content });
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx: any, args: { id: any }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }
    
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }
    
    if (comment.userId !== userId) {
      throw new Error("댓글을 삭제할 권한이 없습니다.");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});