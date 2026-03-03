import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split Bill - Bagi Tagihan Bareng Teman",
  description: "Upload struk belanjamu, AI kami otomatis membagi item ke teman-temanmu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-display antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-background-dark">
        {children}
      </body>
    </html>
  );
}
