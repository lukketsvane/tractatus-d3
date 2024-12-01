import './globals.css'
import { GeistMono } from 'geist/font/mono'
import type { Metadata } from 'next'

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
    <html lang="en" className={GeistMono.className}>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}

