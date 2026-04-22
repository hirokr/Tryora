import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "./../components/Header";
import Footer from "./../components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tryora - Future of Digital Fashion",
  description: "AI-driven 3D reconstruction and cinematic try-on experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap"
        />
      </head>

      {/* ⚠️ EVERYTHING visual must be inside BODY */}
      <body>
        {/* Global Header */}
        <Header />

        {/* Page Content */}
        <main className="pt-20">{children}</main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}