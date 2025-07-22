import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - ดึงกิจกรรมตาม ID
export async function GET(request: NextRequest) {
  try {
    // Extract ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const event = await prisma.event.findUnique({
      where: {
        id: id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: "ไม่พบกิจกรรมที่ระบุ" },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม" },
      { status: 500 }
    )
  }
}

// PUT - แก้ไขกิจกรรม
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      )
    }

    // Extract ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const body = await request.json()
    const { title, description, startDate, endDate, location, organizer } = body

    // Validation
    if (!title || !startDate || !endDate || !location || !organizer) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    // Check if start date is before end date
    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: "วันที่เริ่มต้องมาก่อนวันที่สิ้นสุด" },
        { status: 400 }
      )
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "ไม่พบกิจกรรมที่ระบุ" },
        { status: 404 }
      )
    }

    const event = await prisma.event.update({
      where: {
        id: id
      },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        organizer
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม" },
      { status: 500 }
    )
  }
}

// DELETE - ลบกิจกรรม
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      )
    }

    // Extract ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "ไม่พบกิจกรรมที่ระบุ" },
        { status: 404 }
      )
    }

    await prisma.event.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: "ลบกิจกรรมเรียบร้อยแล้ว" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
      { status: 500 }
    )
  }
}