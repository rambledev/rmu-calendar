import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST - สร้าง admin user คนแรก (ใช้เพียงครั้งเดียว)
export async function POST(request: NextRequest) {
  try {
    // Check if any admin user already exists
    const existingUser = await prisma.user.findFirst()
    
    if (existingUser) {
      return NextResponse.json(
        { error: "ระบบได้ถูกตั้งค่าแล้ว" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
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

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: "สร้างผู้ใช้ admin เรียบร้อยแล้ว",
      user
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" },
      { status: 500 }
    )
  }
}