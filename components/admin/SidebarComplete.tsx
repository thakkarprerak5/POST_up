"use client";

import { User, FolderKanban, LogOut, X, Shield, Settings, Users, FileText, BarChart3, Activity, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const menuItems: MenuItem[] = [
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Project Collection", href: "/collections", icon: FolderKanban },
];

// Enhanced menu item type with super admin support
interface MenuItem {
  name: string;
  href: string;
  icon: any;
  superAdminOnly?: boolean;
}

/**
 * MERGED: Complete sidebar with profile dropdown functionality
 * Combines all history updates:
 * - Base menu always visible
 * - Admin menu dynamically added based on role
 * - Super admin distinction
 * - Professional styling
 */
export function getAllMenuItems(session: any) {
  // ALWAYS return base menu items - never block UI visibility
  const baseMenuItems: MenuItem[] = [
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Project Collection", href: "/collections", icon: FolderKanban },
  ];

  // CRITICAL FIX: Always return base menu even if session is null/undefined
  if (!session || !session.user) {
    return baseMenuItems;
  }

  // Check both role and type fields for admin access (SAFE - doesn't block UI)
  const isAdmin = session?.user?.role === 'admin' ||
    session?.user?.role === 'super-admin' ||
    session?.user?.role === 'mentor' ||
    (session?.user as any)?.type === 'admin' ||
    (session?.user as any)?.type === 'super-admin' ||
    (session?.user as any)?.type === 'mentor';

  const isSuperAdmin = session?.user?.role === 'super-admin' ||
    (session?.user as any)?.type === 'super-admin';

  // Complete admin menu items from history with proper typing
  const adminMenuItems: MenuItem[] = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
    { name: "Users Management", href: "/admin/users", icon: Users },
    { name: "Assignment Requests", href: "/admin/assignment-requests", icon: UserCheck },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Activity Logs", href: "/admin/activity", icon: Activity, superAdminOnly: true },
    { name: "Settings", href: "/admin/settings", icon: Settings, superAdminOnly: true },
  ];

  // Filter admin menu items based on role
  const filteredAdminMenuItems = adminMenuItems.filter(item =>
    !item.superAdminOnly || isSuperAdmin
  );

  // CRITICAL FIX: Always return base menu, conditionally add admin items
  const finalMenu = isAdmin ? [...filteredAdminMenuItems, ...baseMenuItems] : baseMenuItems;

  return finalMenu;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const allMenuItems = getAllMenuItems(session);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            allMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.superAdminOnly && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Super
                  </span>
                )}
              </Link>
            ))
          )}
        </nav>

        {/* User info and logout */}
        {session && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {session.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
