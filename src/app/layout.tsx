import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ระบบปฏิทินกิจกรรม มรม.',
  description: 'ระบบจัดการปฏิทินกิจกรรม มหาวิทยาลัยราชภัฏมหาสารคาม',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}