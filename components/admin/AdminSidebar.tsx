"use client";

import { Shield, Settings, Users, FileText, BarChart3, Activity, GraduationCap, Briefcase, UserCheck, LogOut, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<{ photo?: string }>({});

  // Fetch user profile photo
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/debug/admin-profile')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUserProfile({ photo: data.user.photo });
            console.log('📸 Admin profile photo loaded:', data.user.photo);
          }
        })
        .catch(error => {
          console.error('❌ Error fetching admin profile:', error);
        });
    }
  }, [session?.user?.email]);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: Shield },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Students", href: "/admin/students", icon: GraduationCap },
    { name: "Mentors", href: "/admin/mentors", icon: Users },
    { name: "Projects", href: "/admin/projects", icon: Briefcase },
    { name: "Assignment Requests", href: "/admin/assignment-requests", icon: UserCheck, superAdminOnly: true },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "User Onboarding", href: "/admin/onboarding", icon: UserPlus, superAdminOnly: true },
    { name: "Activity Logs", href: "/admin/activity", icon: Activity, superAdminOnly: true },
    { name: "Settings", href: "/admin/settings", icon: Settings, superAdminOnly: true },
  ];

  const isSuperAdmin = session?.user?.role === 'super-admin' || (session?.user as any)?.type === 'super-admin';

  const filteredMenuItems = menuItems.filter(item => !item.superAdminOnly || isSuperAdmin);

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'}  bg-white border-r border-gray-200/60 flex-shrink-0 flex flex-col h-screen sticky top-0 shadow-sm transition-all duration-300 ease-out`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200/60">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Admin<span className="font-normal text-gray-500">Panel</span></span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200/60">
        <div className="bg-gray-50/30 rounded-xl p-3 border border-gray-200/40">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden">
              <Avatar className="w-full h-full rounded-full">
                <AvatarImage
                  src={userProfile.photo || session?.user?.image || ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 font-medium text-sm w-full h-full rounded-full flex items-center justify-center">AD</AvatarFallback>
              </Avatar>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{session?.user?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{session?.user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto bg-gray-50/20 p-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
                } ${isActive
                  ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`w-3.5 h-3.5 transition-colors duration-200 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
              {!isCollapsed && (
                <>
                  <span className={`text-sm font-medium truncate transition-colors duration-200 ${isActive ? "text-blue-700 font-medium" : "text-gray-700"}`}>{item.name}</span>
                  {item.superAdminOnly && (
                    <span className="px-1.5 py-0.5 text-[8px] font-medium text-blue-600 bg-blue-100 rounded-md">
                      SUPER
                    </span>
                  )}
                </>
              )}
              {isCollapsed && item.superAdminOnly && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200/60">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ${isCollapsed ? 'px-2' : 'px-3'
            }`}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className={`w-3.5 h-3.5 flex-shrink-0`} />
          {!isCollapsed && <span className="text-sm font-medium">Exit Admin</span>}
        </Button>
      </div>
    </aside>
  );
}
