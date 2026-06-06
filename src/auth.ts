import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

// ── Session/JWT type augmentation ──────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    role?: UserRole;
  }
}

// Locally-typed view of the extra JWT fields we set (avoids augmenting the
// `next-auth/jwt` subpath module, which isn't resolvable for augmentation here).
type AppToken = { id?: string; role?: UserRole };

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Magic-link is enabled only when a Resend key is present; otherwise the app
// runs fine on credentials alone (graceful degradation).
const resendKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "UPREVI <login@uprevi.com>";

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
  ...(resendKey
    ? [Resend({ apiKey: resendKey, from: emailFrom })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The generated Prisma 7 client is structurally compatible with the adapter;
  // cast to the adapter's expected client type to satisfy TS.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const t = token as AppToken;
        t.id = user.id;
        t.role = (user.role ?? "OWNER") as UserRole;
      }
      return token;
    },
    session({ session, token }) {
      const t = token as AppToken;
      if (t.id) session.user.id = t.id;
      if (t.role) session.user.role = t.role;
      return session;
    },
  },
});
