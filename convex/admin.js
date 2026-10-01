import { query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("profiles").collect();
    const displayNameByUserId = new Map(profiles.map((p) => [p.userId, p.displayName]));

    return users
      .map((u) => ({
        email: u.email ?? "",
        displayName: displayNameByUserId.get(u._id) || "",
        joinedAt: u._creationTime,
      }))
      .sort((a, b) => a.joinedAt - b.joinedAt);
  },
});
