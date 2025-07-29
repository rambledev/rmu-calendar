// app/api/public/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Fetching public events...")
    
    // ดึงข้อมูล events ทั้งหมดแบบ public (ไม่ต้องตรวจสอบ auth)
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: 'asc'
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

    console.log(`📊 Found ${events.length} events`)

    // กรองข้อมูลที่เป็น sensitive ออก และปรับรูปแบบให้เหมาะสม
    const publicEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      organizer: event.organizer,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
      // ไม่ส่ง userId หรือข้อมูล user ที่เป็น sensitive
    }))

    // Set CORS headers สำหรับ embed
    const response = NextResponse.json(publicEvents)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
    
  } catch (error) {
    console.error('❌ Error fetching public events:', error)
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle OPTIONS request สำหรับ CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}