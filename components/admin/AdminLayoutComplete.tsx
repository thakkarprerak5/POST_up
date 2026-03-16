'use client';

import { useSession } from 'next-auth/react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * MERGED: Professional Admin Layout with white/light blue theme
 * Combines all history updates into single template
 * - Clean white background with subtle shadows
 * - Professional spacing and typography
 * - Responsive design with sidebar integration
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Professional Sidebar with merged history */}
      <AdminSidebar session={session} />
      
      {/* Main Content Area - Professional White Theme */}
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
