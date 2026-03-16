'use client';

import { useSession } from 'next-auth/react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar session={session} />
      <main className="flex-1">
        <div className="bg-white min-h-screen shadow-sm">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
