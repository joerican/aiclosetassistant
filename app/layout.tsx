import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Closet Assistant",
  description: "AI-powered digital closet organizer with outfit shuffle feature",
};

export const runtime = 'edge';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGV2b3RlZC1kcnVtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ'}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
