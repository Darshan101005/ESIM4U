import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import pool from "@/lib/db";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async () => {},
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      // Link a social login to an existing account when the verified email
      // matches — so "same email via Google" resolves to one account, no dupes.
      enabled: true,
      trustedProviders: ["google"],
      // Keep the name/details already on the account when Google links in.
      // So an email/password signup's name wins; only a first-time Google
      // signup uses the Google name. Either way it's editable in Profile.
      updateUserInfoOnLink: false,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7,
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
});
