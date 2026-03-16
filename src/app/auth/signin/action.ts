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

  if (!email || !password) {
    console.log(`[signinAction] MISSING fields email=${email} hasPassword=${!!password}`)
    redirect("/auth/signin?error=missing")
  }

  let redirectPath = "/auth/signin?error=invalid"

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.log(`[signinAction] USER NOT FOUND email=${email}`)
      redirect("/auth/signin?error=email")
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
      console.log(`[signinAction] INVALID PASSWORD email=${email}`)
      redirect("/auth/signin?error=password")
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
    console.log(`[signinAction] COOKIE set secure=${isProduction}`)
    console.log(`[signinAction] SUCCESS email=${email} role=${user.role}`)

    if (["SUPERADMIN", "SUPER-ADMIN"].includes(user.role)) redirectPath = "/super-admin"
    else if (user.role === "ADMIN") redirectPath = "/admin"
    else if (user.role === "CIO") redirectPath = "/cio"
    else redirectPath = "/"

  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" || (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw err
    }
    console.error(`[signinAction] ERROR name=${err instanceof Error ? err.name : 'unknown'} message=${err instanceof Error ? err.message : String(err)} stack=${err instanceof Error ? err.stack : ''}`)
    redirect("/auth/signin?error=server")
  }

  redirect(redirectPath)
}

export async function logoutAction() {
  console.log(`[logoutAction] START`)
  try {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    console.log(`[logoutAction] COOKIE deleted name=${COOKIE_NAME}`)
    console.log(`[logoutAction] SUCCESS`)
    return { ok: true }
  } catch (err) {
    console.error(`[logoutAction] ERROR name=${err instanceof Error ? err.name : 'unknown'} message=${err instanceof Error ? err.message : String(err)} stack=${err instanceof Error ? err.stack : ''}`)
    return { error: "เกิดข้อผิดพลาด" }
  }
}
