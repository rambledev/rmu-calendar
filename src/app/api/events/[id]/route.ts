// app/api/events/[id]/route.ts - Fixed for Next.js 15
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single event by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== GET EVENT BY ID API START ===")
    
    const { id } = await context.params
    console.log("📅 Fetching event ID:", id)

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!event) {
      console.log("❌ Event not found:", id)
      return NextResponse.json(
        { error: "ไม่พบกิจกรรม" },
        { status: 404 }
      )
    }

    console.log("✅ Event found:", event.title)
    console.log("=== GET EVENT BY ID API END (SUCCESS) ===")
    return NextResponse.json(event)

  } catch (error) {
    console.error("💥 Error fetching event:", error)
    console.log("=== GET EVENT BY ID API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}

// PUT update event
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== UPDATE EVENT API START ===")
    
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    console.log("📝 Updating event ID:", id)

    // Find existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "ไม่พบกิจกรรม" },
        { status: 404 }
      )
    }

    // Check permissions - only if createdBy field exists
    if (existingEvent.createdBy && session.user.role === "ADMIN" && existingEvent.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, startDate, endDate, location, organizer } = body

    // Validation
    if (!title || !startDate || !endDate || !location || !organizer) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: "วันที่เริ่มต้องน้อยกว่าวันที่สิ้นสุด" },
        { status: 400 }
      )
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        organizer,
      }
    })

    console.log("✅ Event updated successfully:", updatedEvent.id)
    console.log("=== UPDATE EVENT API END (SUCCESS) ===")
    
    return NextResponse.json(updatedEvent)

  } catch (error) {
    console.error("💥 Error updating event:", error)
    console.log("=== UPDATE EVENT API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตกิจกรรม" },
      { status: 500 }
    )
  }
}

// DELETE event
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== DELETE EVENT API START ===")
    
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    console.log("🗑️ Deleting event ID:", id)

    // Find existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "ไม่พบกิจกรรม" },
        { status: 404 }
      )
    }

    // Check permissions - only if createdBy field exists
    if (existingEvent.createdBy && session.user.role === "ADMIN" && existingEvent.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ลบกิจกรรมนี้" },
        { status: 403 }
      )
    }

    // Delete event
    await prisma.event.delete({
      where: { id }
    })

    console.log("✅ Event deleted successfully:", id)
    console.log("=== DELETE EVENT API END (SUCCESS) ===")
    
    return NextResponse.json(
      { message: "ลบกิจกรรมสำเร็จ" },
      { status: 200 }
    )

  } catch (error) {
    console.error("💥 Error deleting event:", error)
    console.log("=== DELETE EVENT API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
      { status: 500 }
    )
  }
}