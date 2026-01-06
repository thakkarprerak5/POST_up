'use client';

import { usePathname } from 'next/navigation';
import { MainNav } from "@/components/main-nav";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  
  return (
    <>
      {!isAuthPage && <MainNav />}
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
