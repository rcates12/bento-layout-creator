import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Serif_Display } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lintel",
  description:
    "Visual bento layout builder — craft grid layouts and export clean Tailwind CSS markup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${notoSerifDisplay.variable} dark`}>
      <body className="h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
