import { Inter } from "next/font/google";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from "sonner";

import "./globals.css";
import { FooterCTA } from "@/components/ui/footer-cta";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Daily Rejection",
  description: "Challenge yourself to overcome rejection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50">{children}</main>
        <Toaster richColors position="bottom-right" closeButton />
        <FooterCTA />
      </body>
    </html>
  );
}
