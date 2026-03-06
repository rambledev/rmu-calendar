// src/app/api/debug-auth/route.ts
// ⚠️ ลบไฟล์นี้ออกหลัง debug เสร็จแล้ว!

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL:    process.env.NEXTAUTH_URL    || "❌ NOT SET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
      ? "✅ SET (" + process.env.NEXTAUTH_SECRET.slice(0, 8) + "...)"
      : "❌ NOT SET",
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL_INTERNAL || "❌ NOT SET",
    NODE_ENV:        process.env.NODE_ENV         || "❌ NOT SET",
    DATABASE_URL:    process.env.DATABASE_URL
      ? "✅ SET"
      : "❌ NOT SET",
  })
}