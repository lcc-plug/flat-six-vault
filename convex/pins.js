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
  unreleased: v.boolean(),
  releaseDate: v.string(),
};

export const create = mutation({
  args: { ...pinFields, addedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("pins", args);
  },
});

export const update = mutation({
  args: { id: v.id("pins"), suppressRecentlyReleased: v.optional(v.boolean()), ...pinFields },
  handler: async (ctx, { id, suppressRecentlyReleased, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(id);
    let releasedAt = existing?.releasedAt;
    if (existing && existing.unreleased && !fields.unreleased) {
      // Just flipped from unreleased to released — mark it for the
      // "recently released" view. Automatic, no extra admin step.
      releasedAt = Date.now();
    } else if (fields.unreleased) {
      // Re-marked unreleased (correcting a mistake) — it's not a release anymore.
      releasedAt = undefined;
    }
    // Manual override — e.g. "unreleased" was checked by mistake and the
    // admin doesn't want it showing up as a fresh release once unchecked.
    if (suppressRecentlyReleased) releasedAt = undefined;
    await ctx.db.patch(id, { ...fields, releasedAt });
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
