import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("profiles").collect();
    const garage = await ctx.db.query("garageEntries").collect();
    const wishlist = await ctx.db.query("wishlistEntries").collect();
    const displayNameByUserId = new Map(profiles.map((p) => [p.userId, p.displayName]));
    const count = (entries) => {
      const m = new Map();
      for (const e of entries) m.set(e.userId, (m.get(e.userId) || 0) + 1);
      return m;
    };
    const garageCounts = count(garage);
    const wishlistCounts = count(wishlist);

    return users
      .map((u) => ({
        id: u._id,
        email: u.email ?? "",
        displayName: displayNameByUserId.get(u._id) || "",
        joinedAt: u._creationTime,
        garageCount: garageCounts.get(u._id) || 0,
        wishlistCount: wishlistCounts.get(u._id) || 0,
      }))
      .sort((a, b) => a.joinedAt - b.joinedAt);
  },
});

// Read-only: admins can look at a user's garage and wishlist, never change them.
export const userCollection = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    const garage = await ctx.db
      .query("garageEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const wishlist = await ctx.db
      .query("wishlistEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const pinView = async (pinId) => {
      const pin = await ctx.db.get(pinId);
      if (!pin) return null;
      return {
        id: pin._id,
        name: pin.name,
        chassisCode: pin.chassisCode,
        variant: pin.variant,
        editionSize: pin.editionSize,
        image: pin.images?.[0] ?? null,
      };
    };

    const garagePins = [];
    for (const e of garage) {
      const pin = await pinView(e.pinId);
      if (pin) garagePins.push({ ...pin, quantity: e.quantity, notes: e.notes ?? "" });
    }
    const wishlistPins = [];
    for (const e of wishlist) {
      const pin = await pinView(e.pinId);
      if (pin) wishlistPins.push(pin);
    }
    const byChassis = (a, b) => a.chassisCode.localeCompare(b.chassisCode) || a.name.localeCompare(b.name);
    return { garage: garagePins.sort(byChassis), wishlist: wishlistPins.sort(byChassis) };
  },
});
