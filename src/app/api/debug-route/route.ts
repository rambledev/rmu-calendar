// src/app/api/debug-auth/route.ts
// ⚠️ ลบไฟล์นี้ออกหลังจาก debug เสร็จแล้ว!

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // ทดสอบ DB connection
  let dbStatus = "❌ FAILED"
  let dbError = ""
  let userCount = 0

  try {
    userCount = await prisma.user.count()
    dbStatus = "✅ CONNECTED"
  } catch (e: any) {
    dbError = e.message
  }

  return NextResponse.json({
    env: {
      NEXTAUTH_URL:    process.env.NEXTAUTH_URL    || "❌ NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET  ? "✅ SET (" + process.env.NEXTAUTH_SECRET.slice(0,6) + "...)" : "❌ NOT SET",
      NODE_ENV:        process.env.NODE_ENV         || "❌ NOT SET",
      DATABASE_URL:    process.env.DATABASE_URL     ? "✅ SET" : "❌ NOT SET",
    },
    database: {
      status:    dbStatus,
      userCount: userCount,
      error:     dbError || null,
    },
  })
}