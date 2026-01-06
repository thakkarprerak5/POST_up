"use client";

import { User, FolderKanban, LogOut, X, Shield, Settings, Users, FileText, BarChart3, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const menuItems = [
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Project Collection", href: "/collections", icon: FolderKanban },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
  
  const adminMenuItems = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
    { name: "Users Management", href: "/admin/users", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Activity Logs", href: "/admin/activity", icon: Activity },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const allMenuItems = isAdmin ? [...adminMenuItems, ...menuItems] : menuItems;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-border transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-lg font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9 hover:bg-muted"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={session?.user?.image || "/placeholder-user.jpg"}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{session?.user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {allMenuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
