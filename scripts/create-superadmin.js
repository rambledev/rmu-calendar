const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSuperAdminUser() {
  try {
    // ตรวจสอบว่ามี SUPERADMIN อยู่แล้วหรือไม่
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPERADMIN'
      }
    })

    if (existingSuperAdmin) {
      console.log('⚠️  SUPERADMIN user already exists:', {
        id: existingSuperAdmin.id,
        email: existingSuperAdmin.email,
        name: existingSuperAdmin.name,
        role: existingSuperAdmin.role
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('superadmin123456', 12)
    
    // Create SUPERADMIN user
    const superAdminUser = await prisma.user.create({
      data: {
        name: 'Super Admin User',
        email: 'super-admin@event.rmu',
        password: hashedPassword,
        role: 'SUPERADMIN'
      }
    })
    
    console.log('✅ SUPERADMIN User created successfully:', {
      id: superAdminUser.id,
      email: superAdminUser.email,
      name: superAdminUser.name,
      role: superAdminUser.role,
      password: 'superadmin123456' // แสดงรหัสผ่านเพื่อการทดสอบ
    })

    console.log('\n📋 Login credentials:')
    console.log('Email: super-admin@rmu.ac.th')
    console.log('Password: superadmin123456')
    console.log('Role: SUPERADMIN')
    console.log('Access: /super-admin')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Email already exists in database')
    } else {
      console.error('❌ Error creating SUPERADMIN user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// เรียกใช้ function
createSuperAdminUser()