import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          throw new Error("กรุณากรอก Email และ Password")
        }

        try {
          await prisma.$connect()
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log("❌ User not found:", credentials.email)
            throw new Error("ไม่พบผู้ใช้งานนี้")
          }

          let isPasswordValid = false
          
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } else {
            isPasswordValid = credentials.password === user.password
          }

          if (!isPasswordValid) {
            console.log("❌ Invalid password for:", credentials.email)
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
        } finally {
          await prisma.$disconnect().catch(() => {})
        }
      }
    })
  ],
  
  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
        // ✅ ลบ domain ออก - ให้ browser จัดการเอง
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      
      if (trigger === "signIn") {
        console.log("🔑 JWT created for:", token.email, "| Role:", token.role)
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      
      console.log("📝 Session created for:", session.user.email, "| Role:", session.user.role)
      return session
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  
  debug: true,
}