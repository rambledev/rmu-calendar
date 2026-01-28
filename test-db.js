const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV)
    
    await prisma.$connect()
    console.log('✅ Connected to database!')
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })
    
    console.log('👥 Users found:', users.length)
    console.log('📋 Users list:')
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`)
    })
    
    console.log('\n🔍 Testing specific user lookup...')
    const testUser = await prisma.users.findUnique({
      where: { email: 'cc@event.rmu' }
    })
    
    if (testUser) {
      console.log('✅ Test user found:', testUser.email)
      console.log('   Role:', testUser.role)
      console.log('   Password hash starts with:', testUser.password.substring(0, 10))
    } else {
      console.log('❌ Test user NOT found')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Disconnected from database')
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit())