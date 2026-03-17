// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(req: NextRequest) {
  console.log("🔥 LOGIN API HIT")
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "กรุณากรอก Email และ Password" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    let isValid = false
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password)
    } else {
      isValid = password === user.password
    }

    if (!isValid) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role })
    const isProduction = process.env.NODE_ENV === "production"

    const res = NextResponse.json({ ok: true, role: user.role })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}
