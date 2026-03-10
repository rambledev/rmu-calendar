// src/lib/session.ts
// ใช้แทน getServerSession(authOptions) ใน API routes ทั้งหมด

import { cookies } from "next/headers"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return {
    user: {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    }
  }
}