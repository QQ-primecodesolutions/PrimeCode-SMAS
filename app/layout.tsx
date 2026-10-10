import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrimeCode Studio",
  description: "Render PrimeCode Solutions' planned posts into publish-ready slides.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
