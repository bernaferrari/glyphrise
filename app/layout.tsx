import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://glyphrise.vercel.app"),
  title: "Glyphrise — 3D icon motion",
  description: "Turn SVG icons into polished 3D motion.",
  openGraph: {
    type: "website",
    siteName: "Glyphrise",
    title: "Glyphrise — 3D icon motion",
    description: "Turn SVG icons into polished 3D motion.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glyphrise — 3D icon motion",
    description: "Turn SVG icons into polished 3D motion.",
  },
  icons: {
    icon: [{ url: "/glyphrise-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/glyphrise-apple-touch-icon.png", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
