import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Reach",
  description: "Campus Reach",
  applicationName: "Campus Reach",
  icons: {
    icon: [
      { url: "/logos/campusreach-logo.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/logos/campusreach-logo.png?v=2", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/logos/campusreach-logo.png?v=2",
    apple: "/logos/campusreach-logo.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
