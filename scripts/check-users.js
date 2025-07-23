const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log('All users in database:')
    console.table(users)
    
    const cioUser = await prisma.user.findUnique({
      where: { email: 'cio@example.com' }
    })
    
    if (cioUser) {
      console.log('\nCIO user exists:', {
        id: cioUser.id,
        email: cioUser.email,
        name: cioUser.name,
        role: cioUser.role
      })
    } else {
      console.log('\nCIO user not found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()