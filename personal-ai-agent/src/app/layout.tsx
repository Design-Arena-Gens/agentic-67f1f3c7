import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyFree Agent",
  description:
    "Chat with your personal AI agent that runs privately in your browser for free.",
  metadataBase: new URL("https://agentic-67f1f3c7.vercel.app"),
  openGraph: {
    title: "MyFree Agent",
    description:
      "A privacy-friendly AI companion that runs locally in your browser.",
    url: "https://agentic-67f1f3c7.vercel.app",
    siteName: "MyFree Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyFree Agent",
    description:
      "Interact with a personal AI agent without subscriptions or logins.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
