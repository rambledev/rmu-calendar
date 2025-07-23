const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateCIOPassword() {
  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash('cio123456', 12)
    
    // Update CIO user password
    const updatedUser = await prisma.user.update({
      where: { email: 'cio@rmu.com' },
      data: { password: hashedPassword }
    })
    
    console.log('CIO password updated successfully for:', updatedUser.email)
    console.log('New login credentials:')
    console.log('Email: cio@rmu.com')
    console.log('Password: cio123456')
    
  } catch (error) {
    console.error('Error updating password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCIOPassword()