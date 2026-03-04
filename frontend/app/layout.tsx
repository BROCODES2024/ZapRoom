import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZapRoom — Real-time Chat Rooms",
  description:
    "ZapRoom is a real-time, room-based chat application. No signup required — just pick a room ID and start chatting instantly.",
  keywords: ["chat", "real-time", "websocket", "rooms", "zaproom"],
  openGraph: {
    title: "ZapRoom — Real-time Chat Rooms",
    description:
      "Join or create a chat room instantly. No signup required. Powered by WebSockets.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
