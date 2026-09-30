import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("garageEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { pinId: v.id("pins"), quantity: v.number(), notes: v.optional(v.string()) },
  handler: async (ctx, { pinId, quantity, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in.");

    const existing = await ctx.db
      .query("garageEntries")
      .withIndex("by_user_and_pin", (q) => q.eq("userId", userId).eq("pinId", pinId))
      .unique();
    if (existing) throw new Error("Already in your garage.");

    return await ctx.db.insert("garageEntries", { userId, pinId, quantity, notes });
  },
});

export const update = mutation({
  args: { id: v.id("garageEntries"), quantity: v.optional(v.number()), notes: v.optional(v.string()) },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in.");
    const entry = await ctx.db.get(id);
    if (!entry || entry.userId !== userId) throw new Error("Not found.");
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("garageEntries") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in.");
    const entry = await ctx.db.get(id);
    if (!entry || entry.userId !== userId) throw new Error("Not found.");
    await ctx.db.delete(id);
  },
});
