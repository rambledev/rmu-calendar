// app/api/events/route.ts (ปรับปรุงแล้ว)
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - ดึงรายการกิจกรรม (เฉพาะผู้ที่ล็อกอินแล้วเท่านั้น)
export async function GET() {
  try {
    console.log("🔍 API /events called - Starting query...")
    
    const session = await getServerSession(authOptions)
    console.log("👤 Session:", session?.user?.email, "Role:", session?.user?.role)

    // ตรวจสอบการล็อกอิน - บังคับให้ต้องล็อกอินก่อน
    if (!session || !session.user) {
      console.log("❌ No session - Authentication required")
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      )
    }

    // สำหรับ SUPERADMIN แสดงกิจกรรมทั้งหมด
    if (session.user.role === "SUPERADMIN") {
      console.log("👑 SUPERADMIN access - showing all events")
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

      console.log("📤 SUPERADMIN - Sending response with", events.length, "events")
      return NextResponse.json(events)
    }

    // สำหรับ ADMIN และ CIO แสดงเฉพาะกิจกรรมของตัวเอง
    console.log("👤 User access - showing only own events for userId:", session.user.id)
    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id // กรองตาม userId
      },
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

    console.log(`📊 User ${session.user.email} (${session.user.role}) - Events count: ${events.length}`)
    
    // Debug แต่ละ event
    events.forEach((event, index) => {
      console.log(`📋 Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        organizer: event.organizer,
        userId: event.userId,
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

    console.log("📝 Creating new event by:", session.user.email, "Data:", { title, startDate, endDate, location, organizer })

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
        userId: session.user.id // กำหนด userId เป็นคนที่สร้าง
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

    console.log("✅ Event created successfully:", {
      id: event.id,
      title: event.title,
      userId: event.userId,
      createdBy: session.user.email
    })
    
    return NextResponse.json(event, { status: 201 })
    
  } catch (error) {
    console.error("❌ Error creating event:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างกิจกรรม", details: (error as Error).message },
      { status: 500 }
    )
  }
}