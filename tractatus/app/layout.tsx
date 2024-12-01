import './globals.css'
import localFont from 'next/font/local'
import type { Metadata } from 'next'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Tractatus Tree',
  description: 'Interactive visualization of Wittgenstein\'s Tractatus Logico-Philosophicus',
  openGraph: {
    title: 'Tractatus Tree',
    description: 'Interactive visualization of Wittgenstein\'s Tractatus Logico-Philosophicus',
    url: 'https://tractatus-tree.vercel.app',
    images: [
      {
        url: 'https://tractatus-tree.vercel.app/images/screenshot.png',
        width: 1200,
        height: 630,
        alt: 'Tractatus Tree Screenshot',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}



