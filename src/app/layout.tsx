import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "AIZCRM - Admin Dashboard",
  description: "Next Generation Apparel CRM & Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-[#11141b] text-slate-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
