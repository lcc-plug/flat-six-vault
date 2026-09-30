import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  pins: defineTable({
    chassisCode: v.string(),
    name: v.string(),
    series: v.string(),
    year: v.string(),
    variant: v.string(),
    editionSize: v.string(),
    notes: v.string(),
    tags: v.optional(v.string()),
    images: v.array(v.string()),
    legacyCode: v.optional(v.string()),
    addedBy: v.optional(v.string()),
  }).index("by_chassisCode", ["chassisCode"]),

  garageEntries: defineTable({
    userId: v.id("users"),
    pinId: v.id("pins"),
    quantity: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_pin", ["userId", "pinId"])
    .index("by_pin", ["pinId"]),

  wishlistEntries: defineTable({
    userId: v.id("users"),
    pinId: v.id("pins"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_pin", ["userId", "pinId"])
    .index("by_pin", ["pinId"]),

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
  }).index("by_user", ["userId"]),
});
