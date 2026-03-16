'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import { ReportProvider } from './ui/ReportSystem';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ReportProvider>
            {children}
            <Toaster 
              position="top-right"
              expand={false}
              richColors
              closeButton
            />
          </ReportProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
