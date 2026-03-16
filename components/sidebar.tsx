"use client";

import { User, FolderKanban, LogOut, X } from "lucide-react";
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
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-border transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <span className="text-lg font-semibold text-foreground">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9 hover:bg-secondary/50 transition-colors duration-200"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={session?.user?.image || "/placeholder-user.jpg"}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium text-foreground truncate">{session?.user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {session?.user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border bg-card space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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
