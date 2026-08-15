import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

// Secure helper functions for password hashing using built-in crypto module
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === testHash;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "google-placeholder-id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "google-placeholder-secret",
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email Address", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Existing user login
          if (!user.password) {
            // User originally signed up via OAuth, password is not set
            return null;
          }
          if (!verifyPassword(password, user.password)) {
            return null;
          }
          return { id: user.id, email: user.email, name: user.name };
        } else {
          // New user sign up - automatically register them
          const hashedPassword = hashPassword(password);
          const newUser = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: email.split("@")[0] // Fallback default name
            }
          });
          return { id: newUser.id, email: newUser.email, name: newUser.name };
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/editor") || nextUrl.pathname.startsWith("/api/resumes");
      if (isProtectedRoute) {
        return isLoggedIn;
      }
      return true;
    },
    async signIn({ user, account }) {
      if (!user || !user.email) return false;
      if (account?.provider === "google") {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name },
          create: { email: user.email, name: user.name },
        });
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      } else if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}
