'use client';

import { Shield, Users, FileText, BarChart3, Activity, Settings, UserCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * MERGED: Professional Admin Sidebar with complete functionality
 * Combines all history updates:
 * - Professional white/light blue theme
 * - Super admin vs admin distinction
 * - Smooth transitions and hover effects
 * - Active state highlighting
 */
export function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();

  // Role checking from history - supports both role and type fields
  const isAdmin = ["admin", "super-admin"].includes(session?.user?.role) ||
    ["admin", "super-admin"].includes((session?.user as any)?.type);

  const isSuperAdmin = session?.user?.role === 'super-admin' ||
    (session?.user as any)?.type === 'super-admin';

  if (!isAdmin) return null;

  // Complete menu items from history
  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: Shield },
    { href: "/admin/users", label: "Users Management", icon: Users },
    { href: "/admin/assignment-requests", label: "Assignment Requests", icon: UserCheck },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/activity", label: "Activity Logs", icon: Activity, superAdminOnly: true },
    { href: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
  ];

  // Filter based on role (super admin distinction)
  const filteredMenuItems = menuItems.filter(item =>
    !item.superAdminOnly || isSuperAdmin
  );

  return (
    <aside className="w-64 bg-white text-blue-900 min-h-screen border-r border-blue-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-6">Admin Panel</h2>
        <ul className="flex flex-col gap-1">
          {filteredMenuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "bg-blue-500 text-white shadow-sm font-medium"
                    : "hover:bg-blue-50 text-blue-700 hover:text-blue-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.superAdminOnly && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Super
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
