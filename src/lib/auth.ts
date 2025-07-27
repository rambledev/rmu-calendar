import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"

// เพิ่ม type definitions
declare module "next-auth" {
  interface User {
    role: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

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
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email)
            return null
          }

          console.log("User authenticated successfully:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour - สั้นลงเพื่อ force refresh
    updateAge: 0, // Force update session ทุกครั้ง
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  callbacks: {
    // @ts-ignore
    async jwt({ token, user, trigger, account }) {
      console.log("JWT Callback triggered:", { 
        trigger, 
        user: !!user, 
        token: !!token,
        account: account?.provider 
      })
      
      // หาก user login ใหม่ ให้สร้าง token ใหม่ทั้งหมด
      if (user && account) {
        console.log("Creating new JWT token for user:", user.email)
        const newToken = {
          name: user.name,
          email: user.email,
          sub: user.id,
          id: user.id,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
          jti: crypto.randomUUID() // สร้าง unique ID ใหม่
        }
        console.log("New JWT Token created:", newToken)
        return newToken
      }
      
      // หาก token เก่าอายุเกิน 1 ชั่วโมง ให้ refresh
      const now = Math.floor(Date.now() / 1000)
      if (token.iat && (now - (token.iat as number)) > 3600) {
        console.log("Token expired, refreshing...")
        return {
          ...token,
          iat: now,
          exp: now + 3600,
          jti: crypto.randomUUID()
        }
      }
      
      console.log("Using existing JWT Token:", {
        id: token.id,
        role: token.role,
        email: token.email,
        iat: token.iat
      })
      
      return token
    },
    // @ts-ignore
    async session({ session, token, trigger }) {
      console.log("Session callback triggered:", { trigger, tokenRole: token.role })
      
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        console.log("Session updated:", {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email
        })
      }
      return session
    },
    // @ts-ignore
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - URL:", url, "BaseURL:", baseUrl)
      
      // แก้ไข baseUrl หากมีปัญหา
      let cleanBaseUrl = baseUrl
      if (baseUrl.includes('"')) {
        cleanBaseUrl = baseUrl.replace(/"/g, '')
        console.log("Cleaned baseUrl:", cleanBaseUrl)
      }
      
      // หาก URL เป็น default signin redirect (หลัง login สำเร็จ)
      if (url === cleanBaseUrl || url === cleanBaseUrl + '/' || url.endsWith('/auth/signin')) {
        // ให้ redirect ไปหน้าแรก แล้วใช้ client-side redirect
        console.log("Default signin redirect - going to home first")
        return cleanBaseUrl
      }
      
      // หาก URL เป็น relative path
      if (url.startsWith("/")) {
        const finalUrl = `${cleanBaseUrl}${url}`
        console.log("Redirecting to relative path:", finalUrl)
        return finalUrl
      }
      
      // หาก URL มี origin เดียวกับ baseUrl
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(cleanBaseUrl)
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("Redirecting to same origin:", url)
          return url
        }
      } catch (error) {
        console.log("URL parsing error:", error)
      }
      
      // Default redirect to home
      console.log("Default redirect to:", cleanBaseUrl)
      return cleanBaseUrl
    }
  },
  events: {
    // @ts-ignore
    async signIn({ user, account, profile }) {
      console.log("SignIn event triggered:", {
        user: user,
        account: account?.provider,
        timestamp: new Date().toISOString()
      })
      
      // Log user role for debugging
      console.log("User role after signin:", user.role)
      
      return true
    },
    // @ts-ignore
    async signOut({ session, token }) {
      console.log("SignOut event triggered:", {
        userId: session?.user?.id || token?.id,
        timestamp: new Date().toISOString()
      })
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development", // เปิด debug mode ใน development
}