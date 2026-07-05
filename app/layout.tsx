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
  title: "Shree Krishna Computers",
  description: "Shree Krishna Computers provides computer sales, laptops, printers, accessories, networking solutions, GST billing, inventory management, and technical support.",
  openGraph: {
    title: "Shree Krishna Computers",
    description: "Shree Krishna Computers provides computer sales, laptops, printers, accessories, networking solutions, GST billing, inventory management, and technical support.",
    type: "website",
    locale: "en_IN",
    siteName: "Shree Krishna Computers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
