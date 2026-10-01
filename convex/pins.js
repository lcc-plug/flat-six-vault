import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pins").collect();
  },
});

const pinFields = {
  chassisCode: v.string(),
  name: v.string(),
  series: v.string(),
  year: v.string(),
  variant: v.string(),
  editionSize: v.string(),
  notes: v.string(),
  tags: v.optional(v.string()),
  images: v.array(v.string()),
};

export const create = mutation({
  args: { ...pinFields, addedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("pins", args);
  },
});

export const update = mutation({
  args: { id: v.id("pins"), ...pinFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("pins") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);

    const garage = await ctx.db
      .query("garageEntries")
      .withIndex("by_pin", (q) => q.eq("pinId", id))
      .collect();
    for (const entry of garage) await ctx.db.delete(entry._id);

    const wishlist = await ctx.db
      .query("wishlistEntries")
      .withIndex("by_pin", (q) => q.eq("pinId", id))
      .collect();
    for (const entry of wishlist) await ctx.db.delete(entry._id);

    await ctx.db.delete(id);
  },
});
