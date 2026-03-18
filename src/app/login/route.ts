import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(req: NextRequest) {
console.log("🔥 LOGIN API HIT")

try {
let email = ""
let password = ""


const contentType = req.headers.get("content-type") || ""
console.log("📦 Content-Type:", contentType)

// รองรับทั้ง JSON และ form-urlencoded
if (contentType.includes("application/json")) {
  const body = await req.json()
  email = body.email
  password = body.password
  console.log("📨 BODY (JSON):", body)
} else {
  const body = await req.text()
  console.log("📨 BODY (TEXT):", body)
  const params = new URLSearchParams(body)
  email = params.get("email") || ""
  password = params.get("password") || ""
}

console.log("📧 EMAIL INPUT:", email)
console.log("🔑 PASSWORD INPUT:", password)

if (!email || !password) {
  console.log("❌ Missing email or password")
  return NextResponse.json({ error: "กรุณากรอก Email และ Password" }, { status: 400 })
}

const user = await prisma.user.findUnique({ where: { email } })
console.log("👤 USER FOUND:", user ? user.email : "NOT FOUND")

if (!user) {
  console.log("❌ USER NOT FOUND")
  return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
}

console.log("🗄 PASSWORD IN DB:", user.password)

let isValid = false

if (user.password.startsWith("$2")) {
  console.log("🔐 USING BCRYPT COMPARE")
  isValid = await bcrypt.compare(password, user.password)
} else {
  console.log("🔓 USING PLAIN TEXT COMPARE")
  isValid = password === user.password
}

console.log("✅ IS VALID:", isValid)

if (!isValid) {
  console.log("❌ PASSWORD NOT MATCH")
  return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
}

console.log("🎉 LOGIN SUCCESS")

const token = await signToken({
  id: user.id,
  email: user.email,
  role: user.role,
})

const res = NextResponse.json({ ok: true, role: user.role })

res.cookies.set(COOKIE_NAME, token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 60 * 60 * 8,
})

console.log("🍪 COOKIE SET:", COOKIE_NAME)

return res


} catch (err) {
console.error("🔥 LOGIN ERROR:", err)
return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
}
}
