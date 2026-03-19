import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Nav } from '@/components/nav';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trade Tracker - Client PNL Management',
  description: 'Track client PNL, commissions, and weekly reports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <Nav />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
