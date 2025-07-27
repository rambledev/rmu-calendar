import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// PATCH - อัพเดท user (role, name, password)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, name, password } = await request.json()
    const userId = params.id

    // ตรวจสอบว่า user มีอยู่จริง
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // เตรียมข้อมูลที่จะอัพเดท
    const updateData: any = {}

    // อัพเดท name ถ้ามี
    if (name !== undefined) {
      updateData.name = name
    }

    // อัพเดท role ถ้ามี และไม่ใช่ตัวเอง
    if (role !== undefined) {
      if (existingUser.email === session.user.email) {
        return NextResponse.json(
          { error: "Cannot change your own role" },
          { status: 400 }
        )
      }
      updateData.role = role
    }

    // อัพเดท password ถ้ามี
    if (password !== undefined && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // อัพเดท user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - ลบ user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // ตรวจสอบว่า user มีอยู่จริง
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // ป้องกันการลบตัวเอง
    if (existingUser.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // ลบ user
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}