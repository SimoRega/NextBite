import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NextBite · Mangia meglio, al momento giusto",
  description:
    "Il tuo diario alimentare, i tuoi progressi e suggerimenti che seguono la tua giornata.",
  manifest: "/manifest.webmanifest",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
