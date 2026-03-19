import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(req: NextRequest) {
  console.log("🔥 LOGIN API HIT")

  try {
    const bodyText = (await req.text()).trim()
console.log("📦 RAW BODY Trimmed:", bodyText)

    let email = ""
    let password = ""

    try {
      const json = JSON.parse(bodyText)
      email = json.email || ""
      password = json.password || ""
      console.log("📨 PARSED JSON:", json)
    } catch {
      const params = new URLSearchParams(bodyText)
      email = params.get("email") || ""
      password = params.get("password") || ""
      console.log("📨 PARSED FORM:", { email, password })
    }

    console.log("📧 EMAIL:", email)

    const user = await prisma.user.findUnique({ where: { email } })
    console.log("👤 USER:", user)

    if (!user) {
      return NextResponse.json({ error: "not found" }, { status: 401 })
    }

    let isValid = false
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password)
    } else {
      isValid = password === user.password
    }

    console.log("✅ VALID:", isValid)

    if (!isValid) {
      return NextResponse.json({ error: "invalid password" }, { status: 401 })
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const res = NextResponse.json({ ok: true, role: user.role })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return res

  } catch (err: any) {
    console.error("💥 LOGIN ERROR:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}