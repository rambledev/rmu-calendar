import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth" // ✅ แก้ไข import path
import { prisma } from "@/lib/prisma"

// GET - ดึงรายการกิจกรรมทั้งหมด
export async function GET() {
  try {
    console.log("🔍 API /events called - Starting query...")
    
    const events = await prisma.event.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    console.log("📊 Raw events from DB:", events)
    console.log("📊 Events count:", events.length)

    // Debug แต่ละ event
    events.forEach((event, index) => {
      console.log(`📋 Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        organizer: event.organizer,
        user: event.user
      })
    })

    console.log("📤 Sending response with", events.length, "events")
    return NextResponse.json(events)
    
  } catch (error) {
    console.error("❌ Error fetching events:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม", details: (error as Error).message },
      { status: 500 }
    )
  }
}

// POST - สร้างกิจกรรมใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, startDate, endDate, location, organizer } = body

    console.log("📝 Creating new event:", { title, startDate, endDate, location, organizer })

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

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        organizer,
        userId: session.user.id
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

    console.log("✅ Event created:", event)
    return NextResponse.json(event, { status: 201 })
    
  } catch (error) {
    console.error("❌ Error creating event:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างกิจกรรม", details: (error as Error).message },
      { status: 500 }
    )
  }
}