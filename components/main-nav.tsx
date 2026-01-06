'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/search/search-input';
import { Button } from '@/components/ui/button';
import { Home, Plus, User, LogIn, LogOut } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

export function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Feed', href: '/feed', icon: null },
    { name: 'Projects', href: '/projects', icon: null },
    { name: 'Mentors', href: '/mentors', icon: null },
  ];

  return (
    // <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    //   <div className="container flex h-16 items-center justify-between">
    //     <div className="flex items-center space-x-6">
    //       <Link href="/" className="flex items-center space-x-2">
    //         <span className="font-bold text-xl">ProjectHub</span>
    //       </Link>
    //       
    //       <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
    //         {navItems.map((item) => {
    //           const isActive = pathname === item.href;
    //           const Icon = item.icon;
    //           return (
    //             <Link
    //               key={item.href}
    //               href={item.href}
    //               className={cn(
    //                 'transition-colors hover:text-foreground/80',
    //                 isActive ? 'text-foreground' : 'text-foreground/60'
    //               )}
    //             >
    //               {Icon && <Icon className="h-4 w-4" />}
    //               {!Icon && item.name}
    //             </Link>
    //           );
    //         })}
    //       </nav>
    //     </div>

    //     <div className="flex-1 max-w-xl mx-4">
    //       <SearchInput variant="dialog" />
    //     </div>

    //     <div className="flex items-center space-x-4">
    //       <Button size="sm" variant="outline" asChild>
    //         <Link href="/upload" className="hidden sm:flex items-center">
    //           <Plus className="mr-2 h-4 w-4" />
    //           <span>New Project</span>
    //         </Link>
    //       </Button>

    //       {session ? (
    //         <div className="flex items-center space-x-4">
    //           <Button
    //             variant="ghost"
    //             size="icon"
    //             className="rounded-full"
    //             asChild
    //           >
    //             <Link href="/profile">
    //               <User className="h-5 w-5" />
    //               <span className="sr-only">Profile</span>
    //             </Link>
    //           </Button>
    //           <Button
    //             variant="ghost"
    //             size="sm"
    //             className="text-sm"
    //             onClick={() => signOut()}
    //           >
    //             <LogOut className="mr-2 h-4 w-4" />
    //             <span>Sign out</span>
    //           </Button>
    //         </div>
    //       ) : (
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           className="text-sm"
    //           onClick={() => signIn()}
    //         >
    //           <LogIn className="mr-2 h-4 w-4" />
    //           <span>Sign in</span>
    //         </Button>
    //       )}
    //     </div>
    //   </div>
    // </header>
    null
  );
}
