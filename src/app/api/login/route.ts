// src/app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(req: NextRequest) {
  console.log("🔥 LOGIN API HIT")

  try {
    const bodyText = await req.text()
    console.log("📦 RAW BODY:", bodyText)

    const params = new URLSearchParams(bodyText)
    const email = params.get("email") || ""
    const password = params.get("password") || ""

    console.log("📧 EMAIL:", email)

    const user = await prisma.user.findUnique({ where: { email } })
    console.log("👤 USER:", user)

    if (!user) {
      return NextResponse.json({ error: "not found" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    console.log("✅ VALID:", isValid)

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("💥 LOGIN ERROR FULL:", err)
    console.error("💥 STACK:", err?.stack)

    return NextResponse.json(
      { error: err?.message || "server error" },
      { status: 500 }
    )
  }
}
