import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"

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
    iat?: number
    exp?: number
    jti?: string
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
        console.log("=== AUTHORIZE FUNCTION START ===")
        console.log("📧 Attempting login for:", credentials?.email)
        console.log("🔐 Password provided:", !!credentials?.password)
        console.log("📅 Timestamp:", new Date().toISOString())

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          console.log("🔍 Searching for user in database...")
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log("❌ User not found:", credentials.email)
            return null
          }

          console.log("✅ User found in database:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hasPassword: !!user.password
          })

          console.log("🔐 Comparing passwords...")
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("❌ Invalid password for user:", credentials.email)
            return null
          }

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }

          console.log("✅ User authenticated successfully:", userObject)
          console.log("=== AUTHORIZE FUNCTION END ===")

          return userObject
        } catch (error) {
          console.error("💥 Auth error:", error)
          console.log("=== AUTHORIZE FUNCTION END (ERROR) ===")
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 5 * 60, // Update every 5 minutes
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      console.log("=== JWT CALLBACK START ===")
      console.log("🔄 JWT Callback triggered:", { 
        trigger, 
        hasUser: !!user, 
        hasToken: !!token,
        provider: account?.provider,
        timestamp: new Date().toISOString()
      })

      // กรณี Login ใหม่ (มี user และ account)
      if (user && account) {
        console.log("🆕 Creating new JWT token for user:", user.email)
        
        const now = Math.floor(Date.now() / 1000)
        const newToken: JWT = {
          name: user.name,
          email: user.email,
          sub: user.id,
          id: user.id,
          role: user.role,
          iat: now,
          exp: now + (60 * 60), // 1 hour
          jti: crypto.randomUUID()
        }
        
        console.log("✅ New JWT Token created:", {
          id: newToken.id,
          email: newToken.email,
          role: newToken.role,
          iat: new Date(newToken.iat! * 1000).toLocaleString('th-TH'),
          exp: new Date(newToken.exp! * 1000).toLocaleString('th-TH'),
          jti: newToken.jti
        })
        console.log("=== JWT CALLBACK END (NEW TOKEN) ===")
        return newToken
      }
      
      // ตรวจสอบ Token หมดอายุ
      const now = Math.floor(Date.now() / 1000)
      const tokenIssueTime = typeof token.iat === 'number' ? token.iat : 0
      const tokenAge = now - tokenIssueTime
      const isExpired = tokenAge > 3600 // 1 hour
      
      console.log("🕐 Token age check:", {
        currentTime: new Date(now * 1000).toLocaleString('th-TH'),
        tokenIssued: tokenIssueTime > 0 ? new Date(tokenIssueTime * 1000).toLocaleString('th-TH') : 'N/A',
        tokenAge: `${Math.floor(tokenAge / 60)} minutes`,
        isExpired: isExpired,
        tokenIatType: typeof token.iat,
        tokenIatValue: token.iat
      })

      if (isExpired && tokenIssueTime > 0) {
        console.log("⚠️ Token expired, refreshing...")
        const refreshedToken: JWT = {
          ...token,
          iat: now,
          exp: now + 3600,
          jti: crypto.randomUUID()
        }
        console.log("✅ Token refreshed:", {
          newIat: new Date(now * 1000).toLocaleString('th-TH'),
          newExp: new Date((now + 3600) * 1000).toLocaleString('th-TH')
        })
        console.log("=== JWT CALLBACK END (REFRESHED) ===")
        return refreshedToken
      }
      
      console.log("✅ Using existing JWT Token:", {
        id: token.id,
        role: token.role,
        email: token.email,
        issuedAt: tokenIssueTime > 0 ? new Date(tokenIssueTime * 1000).toLocaleString('th-TH') : 'N/A',
        expiresAt: typeof token.exp === 'number' ? new Date(token.exp * 1000).toLocaleString('th-TH') : 'N/A'
      })
      console.log("=== JWT CALLBACK END (EXISTING) ===")
      
      return token
    },
    async session({ session, token, trigger }) {
      console.log("=== SESSION CALLBACK START ===")
      console.log("📋 Session callback triggered:", { 
        trigger, 
        hasToken: !!token,
        hasSession: !!session,
        tokenRole: token?.role,
        timestamp: new Date().toISOString()
      })
      
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        
        console.log("✅ Session updated with token data:", {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          name: session.user.name
        })
      } else {
        console.log("⚠️ Missing token or session.user:", {
          hasToken: !!token,
          hasSessionUser: !!session?.user,
          tokenData: token ? { id: token.id, role: token.role } : null
        })
      }
      
      console.log("📤 Final session object:", {
        userId: session?.user?.id,
        userRole: session?.user?.role,
        userEmail: session?.user?.email,
        userName: session?.user?.name
      })
      console.log("=== SESSION CALLBACK END ===")
      
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK START ===")
      console.log("🔄 Redirect callback triggered:")
      console.log("📍 URL:", url)
      console.log("🏠 BaseURL:", baseUrl)
      console.log("📅 Timestamp:", new Date().toISOString())
      
      let cleanBaseUrl = baseUrl
      if (baseUrl.includes('"')) {
        cleanBaseUrl = baseUrl.replace(/"/g, '')
        console.log("🧹 Cleaned baseUrl:", cleanBaseUrl)
      }
      
      if (url === cleanBaseUrl || url === cleanBaseUrl + '/' || url.endsWith('/auth/signin')) {
        console.log("🎯 Default signin redirect detected")
        console.log("➡️ Redirecting to role-based redirect handler")
        const roleRedirectUrl = `${cleanBaseUrl}/auth/role-redirect`
        console.log("🔗 Final redirect URL:", roleRedirectUrl)
        console.log("=== REDIRECT CALLBACK END (ROLE REDIRECT) ===")
        return roleRedirectUrl
      }
      
      if (url.startsWith("/")) {
        const finalUrl = `${cleanBaseUrl}${url}`
        console.log("📂 Relative path redirect:", finalUrl)
        console.log("=== REDIRECT CALLBACK END (RELATIVE) ===")
        return finalUrl
      }
      
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(cleanBaseUrl)
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("🌐 Same origin redirect:", url)
          console.log("=== REDIRECT CALLBACK END (SAME ORIGIN) ===")
          return url
        }
      } catch (error) {
        console.log("💥 URL parsing error:", error)
      }
      
      console.log("🏠 Default redirect to home:", cleanBaseUrl)
      console.log("=== REDIRECT CALLBACK END (DEFAULT) ===")
      return cleanBaseUrl
    }
  },
  events: {
    async signIn(message) {
      console.log("=== SIGNIN EVENT START ===")
      console.log("🚪 SignIn event triggered:")
      console.log("👤 User data:", {
        id: message.user?.id,
        email: message.user?.email,
        name: message.user?.name,
        role: message.user?.role
      })
      console.log("🔗 Account provider:", message.account?.provider)
      console.log("📅 Timestamp:", new Date().toISOString())
      console.log("=== SIGNIN EVENT END ===")
    },
    async signOut(message) {
      console.log("=== SIGNOUT EVENT START ===")
      console.log("🚪 SignOut event triggered:")
      console.log("👤 User ID:", message.session?.user?.id || message.token?.id)
      console.log("🎭 User Role:", message.session?.user?.role || message.token?.role)
      console.log("📅 Timestamp:", new Date().toISOString())
      console.log("=== SIGNOUT EVENT END ===")
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}