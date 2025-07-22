import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sarabun } from 'next/font/google'  // เปลี่ยนจาก @next/font
import './globals.css'
import Providers from '@/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })
const sarabun = Sarabun({ 
  subsets: ['thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun'
})

export const metadata: Metadata = {
  title: 'ปฏิทินกิจกรรม มรม.',
  description: 'ระบบจัดการกิจกรรมมหาวิทยาลัยราชภัฏมหาสารคาม',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${inter.className} ${sarabun.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}