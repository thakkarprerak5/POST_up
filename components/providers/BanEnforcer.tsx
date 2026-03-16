"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function BanEnforcer() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'loading' || !session?.user) return;

        const user = session.user as any;
        // Check both potential status strings to be safe
        const banStatus = user.banStatus || user.account_status || 'ACTIVE';

        // Allow access to essential pages
        const allowedPaths = ['/suspended', '/banned', '/api/auth', '/_next'];
        const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

        if (isAllowedPath) return;

        // Strict Enforcement
        if (banStatus === 'SOFT_BAN' || banStatus === 'SOFT_BANNED') {
            router.replace('/suspended');
        } else if (banStatus === 'PROPER_BAN' || banStatus === 'PROPER_BANNED') {
            router.replace('/banned/proper');
        }

    }, [session, status, pathname, router]);

    return null; // This component does not render anything visual
}
