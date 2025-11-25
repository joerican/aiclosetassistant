import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
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
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <VersionBadge />
        </body>
      </html>
    </ClerkProvider>
  );
}
