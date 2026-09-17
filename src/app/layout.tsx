import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Factora - Manufacturing Operations & Management Platform",
    template: "%s | Factora",
  },
  description:
    "Factora is a manufacturing operations and management platform that helps manufacturers manage customer orders, moulds, raw materials, production, inventory, quality, dispatch, GST invoicing, payments, and business operations in one place.",
  applicationName: "Factora",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Factora",
    description:
      "Manufacturing operations and management platform for moulds, raw materials, production, inventory, dispatch, GST invoicing, and payments.",
    siteName: "Factora",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
