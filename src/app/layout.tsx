import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import CartProvider from "@/components/CartProvider";
import MotionProvider from "@/components/motion/MotionProvider";
import Navbar from "@/components/sections/Navbar";
import ToastContainer from "@/components/ui/Toast";
import "./globals.css";

const sansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans-local",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display-local",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-local",
});

export const metadata: Metadata = {
  title: "The Puffer Labs — Expand Your Knowledge",
  description: "The Puffer Labs helps software engineers grow from implementation-focused work into deeper architectural, systems, and engineering thinking.",
  keywords: ["software engineering", "system design", "architecture", "consulting", "technical blog"],
  icons: {
    icon: "/favicon.ico",
    apple: "/logos/puffer-white-lg.png",
  },
  openGraph: {
    title: "The Puffer Labs — Expand Your Knowledge",
    description: "Deep technical content, system design breakdowns, and consulting for engineers who think in systems.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <Navbar />
                <ToastContainer />
                {children}
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
