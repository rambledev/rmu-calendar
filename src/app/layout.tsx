import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sarabun } from 'next/font/google'
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
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