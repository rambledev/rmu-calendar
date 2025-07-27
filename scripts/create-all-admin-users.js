const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ข้อมูลหน่วยงานทั้งหมด
const departments = [
  { name: 'คณะวิทยาศาสตร์และเทคโนโลยี', email: 'sci@event.rmu' },
  { name: 'คณะครุศาสตร์', email: 'edu@event.rmu' },
  { name: 'คณะวิทยาการจัดการ', email: 'frs@event.rmu' },
  { name: 'คณะมนุษยศาสตร์', email: 'husoc@event.rmu' },
  { name: 'คณะเทคโนโลยีการเกษตร', email: 'agt@event.rmu' },
  { name: 'คณะเทคโนโลยีสารสนเทศ', email: 'it@event.rmu' },
  { name: 'คณะรัฐศาสตร์', email: 'pspa@event.rmu' },
  { name: 'คณะนิติศาสตร์', email: 'law@event.rmu' },
  { name: 'คณะวิทวกรรมศาสตร์', email: 'en@event.rmu' },
  { name: 'บัณฑิตวิทยาลัย', email: 'gs@event.rmu' },
  { name: 'สนอ.', email: 'office@event.rmu' },
  { name: 'กองกลาง', email: 'center@event.rmu' },
  { name: 'กองคลัง', email: 'finance@event.rmu' },
  { name: 'กองแผนงานและแผน', email: 'plan@event.rmu' },
  { name: 'กองบริหารงานบุคคล', email: 'personel@event.rmu' },
  { name: 'กองพัฒนานักศึกษา', email: 'std@event.rmu' },
  { name: 'ศูนย์สหกิจ', email: 'coop@event.rmu' },
  { name: 'ศูนย์ธุรกิจ', email: 'cc@event.rmu' },
  { name: 'สถาบันวิจัย', email: 'research@event.rmu' },
  { name: 'สำนักวิทยบริการ', email: 'arit@event.rmu' },
  { name: 'สำนักศิลปและวัฒนธรรม', email: 'culture@event.rmu' },
  { name: 'งานทะเบียน', email: 'reg@event.rmu' },
  { name: 'สำนักบริการวิชาการ', email: 'asc@event.rmu' },
  { name: 'สำนักวิเทศสัมพันธ์', email: 'inter@event.rmu' },
  { name: 'งานประชาสัมพันธ์', email: 'pr@event.rmu' },
  { name: 'สภาวิชาการ', email: 'acc@event.rmu' },
  { name: 'สภามหาวิทยาลัย', email: 'council@event.rmu' },
  { name: 'ตรวจสอบภายใน', email: 'audit@event.rmu' },
  { name: 'โรงเรียนสาธิต มรม.', email: 'satit@event.rmu' }
]

async function createAllAdminUsers() {
  const defaultPassword = 'Event123456*'
  const defaultRole = 'ADMIN'
  
  console.log('🚀 เริ่มสร้าง Admin users สำหรับทุกหน่วยงาน...\n')
  
  try {
    // Hash password ครั้งเดียว
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)
    
    let createdCount = 0
    let skippedCount = 0
    
    for (const dept of departments) {
      try {
        // ตรวจสอบว่ามี user นี้อยู่แล้วหรือไม่
        const existingUser = await prisma.user.findUnique({
          where: { email: dept.email }
        })
        
        if (existingUser) {
          console.log(`⚠️  ข้าม: ${dept.name} (${dept.email}) - มีอยู่แล้ว`)
          skippedCount++
          continue
        }
        
        // สร้าง user ใหม่
        const newUser = await prisma.user.create({
          data: {
            name: dept.name,
            email: dept.email,
            password: hashedPassword,
            role: defaultRole
          }
        })
        
        console.log(`✅ สร้างสำเร็จ: ${newUser.name}`)
        console.log(`   📧 Email: ${newUser.email}`)
        console.log(`   👤 Role: ${newUser.role}`)
        console.log(`   🔑 Password: ${defaultPassword}`)
        console.log('')
        
        createdCount++
        
      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการสร้าง ${dept.name}:`, error.message)
      }
    }
    
    console.log('\n📊 สรุปผลลัพธ์:')
    console.log(`✅ สร้างใหม่: ${createdCount} users`)
    console.log(`⚠️  ข้าม: ${skippedCount} users (มีอยู่แล้ว)`)
    console.log(`📋 รวมทั้งหมด: ${departments.length} หน่วยงาน`)
    
    if (createdCount > 0) {
      console.log('\n🔐 ข้อมูล Login:')
      console.log(`Password เริ่มต้น: ${defaultPassword}`)
      console.log(`Role: ${defaultRole}`)
      console.log(`Format Email: [ตัวย่อ]@event.rmu`)
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดทั่วไป:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 ปิดการเชื่อมต่อฐานข้อมูลแล้ว')
  }
}

// เรียกใช้ function
createAllAdminUsers()