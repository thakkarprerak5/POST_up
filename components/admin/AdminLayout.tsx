'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard,
  Users,
  FolderOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Project Moderation', href: '/admin/projects', icon: FolderOpen },
  { name: 'Reports & Abuse', href: '/admin/reports', icon: AlertTriangle },
  { name: 'Comment Management', href: '/admin/comments', icon: MessageSquare },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Activity Logs', href: '/admin/activity', icon: Shield, superAdminOnly: true },
  { name: 'System Settings', href: '/admin/settings', icon: Settings, superAdminOnly: true },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await router.push('/api/auth/signout');
  };

  const isSuperAdmin = session?.user?.role === 'super_admin';
  const filteredNavigation = navigation.filter(item => !item.superAdminOnly || isSuperAdmin);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-black transition-colors hover:text-white" />
            </button>
          </div>
          <SidebarContent 
            navigation={filteredNavigation} 
            pathname={pathname || ''} 
            session={session} 
            onSignOut={handleSignOut} 
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent 
          navigation={filteredNavigation} 
          pathname={pathname || ''} 
          session={session} 
          onSignOut={handleSignOut} 
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          {/* Mobile menu button */}
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 transition-colors hover:text-white" />
          </button>
          
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <LayoutDashboard className="h-5 w-5 text-black transition-colors hover:text-white" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-black placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
                    placeholder="Admin Panel"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            {/* Back to Main App Button - Mobile */}
            <div className="lg:hidden">
              <Button
                size="sm"
                onClick={() => router.push('/')}
                className="w-full justify-start text-black bg-white  hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-colors" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 bg-blue-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  navigation: typeof navigation;
  pathname: string;
  session: any;
  onSignOut: () => void;
}

function SidebarContent({ navigation, pathname, session, onSignOut }: SidebarContentProps) {
  const isSuperAdmin = session?.user?.role === 'super_admin';
  const router = useRouter();

  return (
    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-100">
      <div className="flex-shrink-0 flex items-center px-4">
        <Shield className="h-8 w-8 text-black transition-colors hover:text-white" />
        <h1 className="ml-3 text-xl font-bold text-black">POST-UP Admin</h1>
      </div>
      
      {/* Back to Main App Button */}
      <div className="px-2 mt-4 mb-2">
        <Button
          size="sm"
          onClick={() => router.push('/')}
          className="w-full justify-start text-black bg-white hover:bg-gradient-to-r from-blue-400 to-blue-600 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-colors" />
          Back to Main App
        </Button>
      </div>

      {/* Sidebar navigation */}
      <nav className="px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                  : 'text-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className="mr-3 h-5 w-5 transition-colors"
              />
              {item.name}
              {item.superAdminOnly && (
                <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Super
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* User info and logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">{session?.user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500 truncate">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onSignOut}
          className="w-full mt-3 justify-start text-white bg-gradient-to-r from-blue-400 to-blue-600 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2 transition-colors" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
