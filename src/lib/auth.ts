import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET is not set. This is insecure for production.");
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
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const user = await db.user.findUnique({
          where: { email },
          include: {
            organizations: {
              where: { joinedAt: { not: null } },
              orderBy: [{ joinedAt: "desc" }, { invitedAt: "desc" }],
              take: 1,
              select: { orgId: true, role: true },
            },
          },
        });

        if (!user) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error(
            "Account temporarily locked due to too many failed login attempts. Please try again later.",
          );
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = failedLoginAttempts >= 5;

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts,
              ...(shouldLock
                ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
                : {}),
            },
          });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        const membership = user.organizations[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: membership?.role || "member",
          activeOrgId: membership?.orgId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "member";
        token.activeOrgId = (user as { activeOrgId?: string }).activeOrgId;
      }

      if (trigger === "update") {
        const requestedOrgId = (session as { activeOrgId?: string } | undefined)
          ?.activeOrgId;
        const userId = typeof token.id === "string" ? token.id : null;

        if (requestedOrgId && userId) {
          const membership = await db.orgMember.findFirst({
            where: {
              userId,
              orgId: requestedOrgId,
              joinedAt: { not: null },
            },
            select: { orgId: true, role: true },
          });

          if (membership) {
            token.activeOrgId = membership.orgId;
            token.role = membership.role;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : "member";
        (session.user as { activeOrgId?: string }).activeOrgId =
          typeof token.activeOrgId === "string" ? token.activeOrgId : undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
