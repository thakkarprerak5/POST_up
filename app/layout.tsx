import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { AuthWrapper } from "@/components/layout/auth-wrapper";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { BanCheckProvider } from "@/components/providers/BanCheckProvider";
import BanEnforcer from "@/components/providers/BanEnforcer";
import { ReportProvider } from "@/components/ui/ReportSystem";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjectHub - Share Your Projects",
  description: "A platform to showcase and discover developer projects",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          <ReportProvider>
            <BanEnforcer />
            <BanCheckProvider>
              <div className="relative flex min-h-screen flex-col">
                <AuthWrapper>
                  {children}
                </AuthWrapper>
              </div>
            </BanCheckProvider>
            <NotificationToast />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                },
              }}
            />
            <Analytics />
          </ReportProvider>
        </Providers>
      </body>
    </html>
  );
}
