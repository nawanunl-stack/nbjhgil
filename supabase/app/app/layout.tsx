import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'ระบบทะเบียนกฎหมายความปลอดภัย',
  description: 'Safety Legal Registry System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sarabun antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
