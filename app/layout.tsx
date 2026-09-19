import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASC Club Portal",
  description: "Private member portal for Automated Systems Club",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
