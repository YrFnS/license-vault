import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️ NEXTAUTH_SECRET is not set. This is insecure for production.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              take: 1,
              select: { role: true },
            },
          },
        });

        if (!user) {
          return null;
        }

        // Check account lockout
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          throw new Error('Account temporarily locked due to too many failed login attempts. Please try again later.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          const lockAccount = newFailedAttempts >= 5;

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedAttempts,
              ...(lockAccount ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
            },
          });

          return null;
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.organizations[0]?.role || "member",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "member";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "member";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
