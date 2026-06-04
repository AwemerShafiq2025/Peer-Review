import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import sql from "@/lib/db";

type DbUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const users = (await sql.query("SELECT * FROM users WHERE email = $1", [email])) as DbUser[];
        const user = users[0];
        const { compareSync } = await import("bcryptjs");

        if (!user || !compareSync(password, user.password_hash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }

      return session;
    },
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/history")) {
        return !!auth?.user;
      }

      return true;
    },
  },
});
