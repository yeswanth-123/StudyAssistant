import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyMate AI - Personalized Study Help",
  description: "AI-powered study assistant that helps you learn from any content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-mesh text-slate-200">{children}</body>
    </html>
  );
}
