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
