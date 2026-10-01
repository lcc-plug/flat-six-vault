import { getAuthUserId } from "@convex-dev/auth/server";

// The catalog owner's email is kept as a Convex env var (ADMIN_EMAIL) rather
// than hardcoded here, since this file ends up in a public repo.
export async function requireAdmin(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Must be signed in.");
  const adminEmail = process.env.ADMIN_EMAIL;
  const user = await ctx.db.get(userId);
  if (!adminEmail || user?.email !== adminEmail) {
    throw new Error("Only the catalog owner can do this.");
  }
  return userId;
}

export async function isAdmin(ctx, userId) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  const user = await ctx.db.get(userId);
  return user?.email === adminEmail;
}
