import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("wishlistEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const toggle = mutation({
  args: { pinId: v.id("pins") },
  handler: async (ctx, { pinId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in.");

    const existing = await ctx.db
      .query("wishlistEntries")
      .withIndex("by_user_and_pin", (q) => q.eq("userId", userId).eq("pinId", pinId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("wishlistEntries", { userId, pinId });
    return true;
  },
});
