import React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { TenantProvider } from "@/components/tenant-provider";
import { Loader2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AquaLearn - Trung Tâm Học Bơi",
  description: "Hệ thống quản lý học tập toàn diện cho việc dạy bơi",
  generator: "v0.dev",
};

function GlobalLoading() {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70'>
      <Loader2 className='h-12 w-12 animate-spin text-sky-500' />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='vi'
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TenantProvider>
              <React.Suspense fallback={<GlobalLoading />}>
                {children}
              </React.Suspense>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
