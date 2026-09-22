import type { Metadata } from "next";
import { Lora, Montserrat } from "next/font/google";
import "./globals.css";

// Proxima Nova is licensed; Montserrat is the substitute named in the Aker spec.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GradPortal",
  description:
    "Graduate programmes, scholarships and research openings in Computer Science, AI, Data Science, Data Engineering and Data Analytics — with the contact behind each one.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lora.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
