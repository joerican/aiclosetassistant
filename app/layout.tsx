import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Closet Assistant",
  description: "AI-powered digital closet organizer with outfit shuffle feature",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
