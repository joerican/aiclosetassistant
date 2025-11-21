import type { Metadata } from "next";
import "./globals.css";
import VersionBadge from "./components/VersionBadge";

export const metadata: Metadata = {
  title: "ClosetAI",
  description: "Your intelligent wardrobe companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <VersionBadge />
      </body>
    </html>
  );
}
