// src/app/auth/signin/action.ts
"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, COOKIE_NAME } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signinAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log(`[signinAction] START email=${email}`)

  try {
    if (!email || !password) {
      console.log(`[signinAction] MISSING fields`)
      redirect("/auth/signin?error=missing")
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.log(`[signinAction] USER NOT FOUND email=${email}`)
      redirect("/auth/signin?error=invalid")
    }

    let isValid = false
    if (user.password.startsWith("$2")) {
      console.log(`[signinAction] BCRYPT compare`)
      isValid = await bcrypt.compare(password, user.password)
    } else {
      console.log(`[signinAction] PLAIN TEXT compare`)
      isValid = password === user.password
    }
    console.log(`[signinAction] PASSWORD valid=${isValid}`)

    if (!isValid) {
      redirect("/auth/signin?error=invalid")
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role })
    const isProduction = process.env.NODE_ENV === "production"
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    console.log(`[signinAction] COOKIE set, redirecting role=${user.role}`)

  } catch (err) {
    console.error(`[signinAction] ERROR:`, err)
    redirect("/auth/signin?error=server")
  }

  const role = (await prisma.user.findUnique({ where: { email } }))?.role
  if (["SUPERADMIN", "SUPER-ADMIN"].includes(role ?? "")) redirect("/super-admin")
  else if (role === "ADMIN") redirect("/admin")
  else if (role === "CIO") redirect("/cio")
  else redirect("/")
}