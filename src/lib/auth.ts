import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // ✅ ลบ PrismaAdapter ออก — ไม่เข้ากับ CredentialsProvider + JWT strategy
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอก Email และ Password")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            throw new Error("ไม่พบผู้ใช้งานนี้")
          }

          let isPasswordValid = false

          if (
            user.password.startsWith('$2a$') ||
            user.password.startsWith('$2b$') ||
            user.password.startsWith('$2y$')
          ) {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } else {
            isPasswordValid = credentials.password === user.password
          }

          if (!isPasswordValid) {
            throw new Error("รหัสผ่านไม่ถูกต้อง")
          }

          console.log("✅ Login successful:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("❌ AUTH ERROR:", error)
          throw error
        }
      }
    })
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
        token.email = user.email
        token.name  = user.name
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id   = token.id
        ;(session.user as any).role  = token.role
        session.user.email = token.email as string
        session.user.name  = token.name  as string
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/signin",
  },

  debug: process.env.NODE_ENV === "development",
}