'use client';

import { useSession } from 'next-auth/react';
import AdminReports from './AdminReports';

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role === 'super_admin' ? 'super_admin' : 'admin';

  return <AdminReports userRole={userRole} />;
}
