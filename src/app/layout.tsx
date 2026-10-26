import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sachin Behera Daily Workflow | College Vidya",
  description: "Private single-administrator workflow management portal for Sachin Behera, Team Leader at College Vidya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-light text-navy-800 antialiased selection:bg-brand-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
