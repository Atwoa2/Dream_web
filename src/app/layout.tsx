import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DreamLabs",
  description: "DreamLabs — платформа доступа к модели",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
