import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { ThemeSync } from "@/components/theme-sync";
import "./globals.css";

// Placeholder typefaces until the owner confirms brand fonts.
const display = Anton({
  variable: "--font-anton",
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
};

// Applies the saved theme before first paint (dark unless the visitor chose light).
const themeScript = `try{var t=localStorage.getItem("lvn-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full antialiased`}
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
