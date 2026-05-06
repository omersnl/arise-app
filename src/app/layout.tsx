import type { Metadata } from "next"
import localFont from "next/font/local"
import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "ARISE — Solo Leveling Health System",
  description: "Level up your health. One dungeon at a time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
