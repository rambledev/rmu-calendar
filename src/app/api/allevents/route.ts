import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("=== ALL EVENTS API START ===")
    console.log("📅 Fetching all events from database")
    console.log("🕐 Timestamp:", new Date().toISOString())

    // ดึงข้อมูล events ทั้งหมดโดยไม่ include creator (เพื่อหลีกเลี่ยง type error)
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: 'asc'
      }
    })

    // แปลง data ให้ compatible กับ frontend
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.location,
      organizer: event.organizer,
      createdAt: event.createdAt.toISOString(),
    }))

    console.log("✅ Events fetched successfully:", formattedEvents.length, "events")
    console.log("=== ALL EVENTS API END ===")

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("💥 Error fetching all events:", error)
    console.log("=== ALL EVENTS API END (ERROR) ===")
    
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}