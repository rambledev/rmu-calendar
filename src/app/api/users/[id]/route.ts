// app/api/users/[id]/route.ts - Fixed for Next.js 15
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// PATCH update user (SUPER-ADMIN/SUPERADMIN only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "SUPER-ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, role, password } = body

    const updateData: any = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "ชื่อไม่สามารถเป็นค่าว่างได้" },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (role !== undefined) {
      if (!['ADMIN', 'CIO', 'SUPER-ADMIN', 'SUPERADMIN'].includes(role)) {
        return NextResponse.json(
          { error: "บทบาทไม่ถูกต้อง" },
          { status: 400 }
        )
      }
      updateData.role = role
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}

// DELETE user (SUPER-ADMIN/SUPERADMIN only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "SUPER-ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Prevent deleting own account
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีของตัวเองได้" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: "ลบผู้ใช้สำเร็จ" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}