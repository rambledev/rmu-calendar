import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET all users (SUPER-ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "SUPER-ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}

// POST create new user (SUPER-ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "SUPER-ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'CIO', 'SUPER-ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: "บทบาทไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}