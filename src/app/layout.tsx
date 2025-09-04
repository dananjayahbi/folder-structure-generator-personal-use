import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Folder Tree Generator - Visualize Your Project Structure",
  description: "Generate beautiful folder tree visualizations for your projects. Simple, fast, and easy to use.",
  keywords: ["folder tree", "directory structure", "project organization", "file explorer"],
  authors: [{ name: "Folder Tree Generator" }],
  openGraph: {
    title: "Folder Tree Generator",
    description: "Generate beautiful folder tree visualizations for your projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Folder Tree Generator",
    description: "Generate beautiful folder tree visualizations",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
