// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all events
export async function GET(request: NextRequest) {
  try {
    console.log("=== GET ALL EVENTS API START ===")
    
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public')
    
    console.log("🔍 Is public request:", isPublic)

    // For public requests (no authentication needed)
    if (isPublic === 'true') {
      const events = await prisma.event.findMany({
        orderBy: {
          startDate: 'asc'
        }
      })
      
      console.log("📅 Public events found:", events.length)
      console.log("=== GET ALL EVENTS API END (SUCCESS) ===")
      return NextResponse.json(events)
    }

    // For authenticated requests
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("❌ No session found")
      console.log("=== GET ALL EVENTS API END (UNAUTHORIZED) ===")
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 401 }
      )
    }

    console.log("👤 User role:", session.user.role)

    let events
    
    // SUPER-ADMIN และ CIO เห็นทุกกิจกรรม
    if (session.user.role === "SUPER-ADMIN" || session.user.role === "CIO") {
      // Check if creator relation exists first
      try {
        events = await prisma.event.findMany({
          include: {
            creator: {
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
      } catch (includeError) {
        // Fallback without include if relation doesn't exist
        console.log("⚠️ Creator relation not found, fetching without include")
        events = await prisma.event.findMany({
          orderBy: {
            startDate: 'asc'
          }
        })
      }
      console.log("📅 All events for SUPER-ADMIN/CIO:", events.length)
    } else {
      // ADMIN เห็นเฉพาะกิจกรรมของตัวเอง
      try {
        events = await prisma.event.findMany({
          where: {
            createdBy: session.user.id
          },
          include: {
            creator: {
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
      } catch (includeError) {
        // Fallback without include if relation doesn't exist
        console.log("⚠️ Creator relation not found, fetching without include")
        events = await prisma.event.findMany({
          where: {
            createdBy: session.user.id
          },
          orderBy: {
            startDate: 'asc'
          }
        })
      }
      console.log("📅 User's events for ADMIN:", events.length)
    }

    console.log("=== GET ALL EVENTS API END (SUCCESS) ===")
    return NextResponse.json(events)

  } catch (error) {
    console.error("💥 Error in GET events:", error)
    console.log("=== GET ALL EVENTS API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}

// POST create new event
export async function POST(request: NextRequest) {
  try {
    console.log("=== CREATE EVENT API START ===")
    
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("❌ No session found for POST")
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต" },
        { status: 401 }
      )
    }

    console.log("👤 Creating event for user:", session.user.email, "Role:", session.user.role)

    const body = await request.json()
    const { title, description, startDate, endDate, location, organizer } = body

    // Validation
    if (!title || !startDate || !endDate || !location || !organizer) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      console.log("❌ Invalid date range")
      return NextResponse.json(
        { error: "วันที่เริ่มต้องน้อยกว่าวันที่สิ้นสุด" },
        { status: 400 }
      )
    }

    console.log("📝 Creating event:", { title, startDate, endDate, location, organizer })

    // Create event - try with createdBy first, fallback without if needed
    let event
    try {
      event = await prisma.event.create({
        data: {
          title,
          description: description || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          organizer,
          createdBy: session.user.id
        }
      })
    } catch (createError) {
      console.log("⚠️ Could not create with createdBy, trying without...")
      // If createdBy field doesn't exist, create without it
      event = await prisma.event.create({
        data: {
          title,
          description: description || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          organizer
        }
      })
    }

    console.log("✅ Event created successfully:", event.id)
    console.log("=== CREATE EVENT API END (SUCCESS) ===")
    
    return NextResponse.json(event, { status: 201 })

  } catch (error) {
    console.error("💥 Error creating event:", error)
    console.log("=== CREATE EVENT API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างกิจกรรม" },
      { status: 500 }
    )
  }
}