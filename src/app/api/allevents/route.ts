// app/api/allevent/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - ดึงรายการกิจกรรมทั้งหมด (สำหรับ public access)
export async function GET() {
  try {
    console.log("🔍 API /allevent called - Getting all public events...")
    
    // ดึงข้อมูล events ทั้งหมดโดยไม่กรองตาม userId
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
    
    console.log("📊 Total public events found:", events.length)
    
    // Debug แต่ละ event
    events.forEach((event, index) => {
      console.log(`📋 Public Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        organizer: event.organizer,
        userId: event.userId,
        createdBy: event.user?.name || event.user?.email
      })
    })
    
    console.log("📤 Sending all public events")
    
    return NextResponse.json(events)
    
  } catch (error) {
    console.error("❌ Error fetching all events:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม", details: (error as Error).message },
      { status: 500 }
    )
  }
}