// src/app/actions/auth.ts
"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"
import { cookies } from "next/headers"

export async function loginAction(email: string, password: string) {
  console.log(`[loginAction] START email=${email}`)
  try {
    if (!email || !password) {
      console.log(`[loginAction] MISSING fields`)
      return { error: "กรุณากรอก Email และ Password" }
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.log(`[loginAction] USER NOT FOUND email=${email}`)
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
    }
    console.log(`[loginAction] USER FOUND id=${user.id} role=${user.role}`)

    let isValid = false
    if (user.password.startsWith("$2")) {
      console.log(`[loginAction] BCRYPT compare`)
      isValid = await bcrypt.compare(password, user.password)
    } else {
      console.log(`[loginAction] PLAIN TEXT compare`)
      isValid = password === user.password
    }
    console.log(`[loginAction] PASSWORD valid=${isValid}`)

    if (!isValid) {
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role })
    console.log(`[loginAction] TOKEN signed`)

    const isProduction = process.env.NODE_ENV === "production"
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    console.log(`[loginAction] COOKIE set name=${COOKIE_NAME} secure=${isProduction}`)
    console.log(`[loginAction] SUCCESS role=${user.role}`)

    return { ok: true, role: user.role }
  } catch (err) {
    console.error(`[loginAction] ERROR:`, err)
    return { error: "เกิดข้อผิดพลาด" }
  }
}