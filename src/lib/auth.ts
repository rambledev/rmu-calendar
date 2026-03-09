// src/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

// ============================================================
// ✅ PART 1: NextAuth authOptions (คงไว้เพื่อไม่ต้องแก้ไฟล์อื่น)
// ============================================================
export const authOptions: NextAuthOptions = {
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
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        if (!user) throw new Error("ไม่พบผู้ใช้งานนี้")

        let isPasswordValid = false
        if (user.password.startsWith("$2")) {
          isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        } else {
          isPasswordValid = credentials.password === user.password
        }
        if (!isPasswordValid) throw new Error("รหัสผ่านไม่ถูกต้อง")

        return { id: user.id, email: user.email, name: user.name || user.email, role: user.role }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id   = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: { signIn: "/auth/signin", error: "/auth/signin" },
}

// ============================================================
// ✅ PART 2: Simple JWT system (สำหรับ middleware และ login ใหม่)
// ============================================================
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret"
)

export const COOKIE_NAME = "admin_session"

export async function signToken(payload: { email: string; role: string; id: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { email: string; role: string; id: string }
  } catch {
    return null
  }
}