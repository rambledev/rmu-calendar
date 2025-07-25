const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createCIOUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('cio123456', 12)
    
    // Create CIO user
    const cioUser = await prisma.user.create({
      data: {
        name: 'CIO User',
        email: 'cio@rmu.ac.th',
        password: hashedPassword,
        role: 'CIO'
      }
    })
    
    console.log('CIO User created successfully:', {
      id: cioUser.id,
      email: cioUser.email,
      name: cioUser.name,
      role: cioUser.role
    })
    
  } catch (error) {
    console.error('Error creating CIO user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCIOUser()