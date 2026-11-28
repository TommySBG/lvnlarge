import type { Metadata, Viewport } from "next";
import { Anton, Cinzel, Great_Vibes, Manrope } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { ThemeSync } from "@/components/theme-sync";
import "./globals.css";

// Placeholder typefaces until the owner confirms brand fonts.
const display = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Elegant luxury serif for the LVN'LARGE wordmark (welcome screen).
const luxe = Cinzel({
  variable: "--font-cinzel",
  weight: ["600", "700"],
  subsets: ["latin"],
});

// Bold flowing script for "Live Large. The World Is Yours."
const script = Great_Vibes({
  variable: "--font-greatvibes",
  weight: "400",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LVN’LARGE — Living Large",
    template: "%s · LVN’LARGE",
  },
  description: "Wear luxury. Feel luxury. Be luxury.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  viewportFit: "cover", // lets the phone tab bar respect the iPhone home indicator
};

// Applies the saved theme before first paint (dark unless the visitor chose light).
const themeScript = `try{var t=localStorage.getItem("lvn-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${luxe.variable} ${script.variable} ${body.variable} h-full antialiased`}
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
