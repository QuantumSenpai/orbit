import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OrbitProvider } from "@/context/OrbitContext";
import { AppShell } from "@/components/shell/AppShell";

const archivo = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORBIT — Personal AI Workspace",
  description:
    "A calm, editorial personal workspace bringing daily tasks, projects, inbox captures, ideas, library references, opportunities, and CV versions into one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body>
        <OrbitProvider>
          <AppShell>{children}</AppShell>
        </OrbitProvider>
      </body>
    </html>
  );
}
