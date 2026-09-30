import { internalMutation } from "./_generated/server";
import { SEED_CATALOG } from "../src/pinsData.js";

export const importPins = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("pins").collect();
    if (existing.length > 0) {
      return { skipped: true, existingCount: existing.length };
    }

    let inserted = 0;
    for (const p of SEED_CATALOG) {
      await ctx.db.insert("pins", {
        chassisCode: p.chassisCode ?? "",
        name: p.name ?? "",
        series: p.series ?? "",
        year: p.year ?? "",
        variant: p.variant ?? "",
        editionSize: p.editionSize ?? "",
        notes: p.notes ?? "",
        tags: p.tags ?? undefined,
        images: p.images ?? [],
        legacyCode: p.id,
      });
      inserted++;
    }
    return { skipped: false, inserted };
  },
});
