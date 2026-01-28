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
        console.log("=" .repeat(80))
        console.log("🔍 AUTHORIZE CALLED AT:", new Date().toISOString())
        console.log("=" .repeat(80))
        console.log("📧 Email:", credentials?.email)
        console.log("🔑 Password provided:", !!credentials?.password)

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          console.log("🔍 Connecting to database...")
          await prisma.$connect()
          console.log("✅ Database connected")
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log("❌ User not found:", credentials.email)
            return null
          }

          console.log("✅ User found!")
          console.log("   Role:", user.role)

          let isPasswordValid = false
          
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } else {
            isPasswordValid = credentials.password === user.password
          }

          if (!isPasswordValid) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ ✅ ✅ AUTHENTICATION SUCCESSFUL! ✅ ✅ ✅")
          console.log("🎉 User authenticated:", user.email, "with role:", user.role)
          console.log("=" .repeat(80))

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("❌ DATABASE ERROR:", error)
          return null
        } finally {
          await prisma.$disconnect().catch(() => {})
        }
      }
    })
  ],
  
  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // 🔥 ลบ cookies configuration ออก - ใช้ default ของ NextAuth
  // NextAuth จะจัดการ cookie names ให้เองตาม environment
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("🎫 Adding user to token - Role:", user.role)
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        console.log("📝 Creating session - Token role:", token.role)
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  
  debug: process.env.NODE_ENV === 'development',
} as NextAuthOptions