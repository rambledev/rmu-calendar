// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-please-change"
)

export const COOKIE_NAME = "admin_session"

export async function signToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { id: string; email: string; role: string }
  } catch {
    return null
  }
}
