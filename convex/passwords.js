import { ConvexError, v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getAuthSessionId,
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { isAdmin } from "./adminAuth";

const MIN_PASSWORD_LENGTH = 8;

export const passwordAccountEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
      .unique();
    return account?.providerAccountId ?? null;
  },
});

export const callerIsAdmin = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => isAdmin(ctx, userId),
});

export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("You need to be signed in.");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ConvexError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    const email = await ctx.runQuery(internal.passwords.passwordAccountEmail, { userId });
    if (!email) throw new ConvexError("This account doesn't use a password.");

    try {
      await retrieveAccount(ctx, { provider: "password", account: { id: email, secret: currentPassword } });
    } catch (e) {
      if (String(e?.message).includes("TooManyFailedAttempts")) {
        throw new ConvexError("Too many attempts. Try again later.");
      }
      throw new ConvexError("Current password is incorrect.");
    }

    await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: newPassword } });
    // Sign out other devices, but keep this one signed in.
    const sessionId = await getAuthSessionId(ctx);
    await invalidateSessions(ctx, { userId, except: sessionId ? [sessionId] : [] });
  },
});

function generateTempPassword() {
  // No look-alike characters (0/O, 1/l/I) so it's easy to read and retype.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export const adminResetPassword = action({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId || !(await ctx.runQuery(internal.passwords.callerIsAdmin, { userId: callerId }))) {
      throw new ConvexError("Only the site owner can do this.");
    }
    if (callerId === userId) {
      throw new ConvexError("Use Change Password on your Profile tab for your own account.");
    }
    const email = await ctx.runQuery(internal.passwords.passwordAccountEmail, { userId });
    if (!email) throw new ConvexError("This account doesn't use a password.");

    const tempPassword = generateTempPassword();
    await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: tempPassword } });
    await invalidateSessions(ctx, { userId });
    return tempPassword;
  },
});
