import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduAI - Personalized Learning Platform",
  description: "AI-powered personalized learning with gamification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
