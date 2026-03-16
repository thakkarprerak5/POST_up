"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * BanCheckProvider - Global ban enforcement component
 * 
 * Checks user's account_status on every route change:
 * - SOFT_BANNED: Redirect to /suspended page
 * - PROPER_BANNED: Show black screen overlay with 48-hour countdown
 * - ACTIVE: Allow normal navigation
 */
export function BanCheckProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip checks during loading or if no session
        if (status === 'loading' || !session?.user) return;

        const user = session.user as any;
        const accountStatus = user.account_status || 'ACTIVE';
        const banTimestamp = user.ban_timestamp;

        // Allow access to suspended page, auth pages, and API routes
        const allowedPaths = ['/suspended', '/login', '/signup', '/api'];
        const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

        // SOFT_BAN: Redirect to suspended page
        // Check for both SOFT_BAN and SOFT_BANNED to be safe
        if ((accountStatus === 'SOFT_BAN' || accountStatus === 'SOFT_BANNED') && !isAllowedPath) {
            router.replace('/suspended'); // Use replace to prevent back navigation
            return;
        }

        // PROPER_BAN: Check if 48 hours have passed
        if ((accountStatus === 'PROPER_BAN' || accountStatus === 'PROPER_BANNED') && banTimestamp) {
            const banDate = new Date(banTimestamp);
            const now = new Date();
            const hoursSinceBan = (now.getTime() - banDate.getTime()) / (1000 * 60 * 60);

            // If more than 48 hours, account should be deleted (handled by cron)
            // For now, show the black screen overlay
            if (hoursSinceBan < 48) {
                // Black screen is rendered below
                return;
            }
        }
    }, [session, status, pathname, router]);

    // Render black screen overlay for PROPER_BANNED users
    if (status === 'authenticated' && session?.user) {
        const user = session.user as any;
        const accountStatus = user.account_status || 'ACTIVE';
        const banTimestamp = user.ban_timestamp;
        const banReason = user.banReason;

        if ((accountStatus === 'PROPER_BAN' || accountStatus === 'PROPER_BANNED') && banTimestamp) {
            const banDate = new Date(banTimestamp);
            const now = new Date();
            const hoursSinceBan = (now.getTime() - banDate.getTime()) / (1000 * 60 * 60);
            const hoursRemaining = Math.max(0, 48 - hoursSinceBan);

            if (hoursSinceBan < 48) {
                return (
                    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4">
                        <Card className="max-w-md w-full bg-red-950 border-red-800 text-white">
                            <CardContent className="p-8 text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="rounded-full bg-red-900 p-4">
                                        <AlertTriangle className="h-12 w-12 text-red-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold text-red-100">
                                        Account Permanently Banned
                                    </h1>
                                    <p className="text-red-200 text-sm">
                                        Your account has been flagged for serious violations.
                                    </p>
                                </div>

                                {banReason && (
                                    <div className="bg-red-900/50 rounded-lg p-4 border border-red-800">
                                        <p className="text-sm text-red-100">
                                            <span className="font-semibold">Reason:</span> {banReason}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-red-200">
                                        <Clock className="h-5 w-5" />
                                        <span className="text-lg font-semibold">
                                            {Math.floor(hoursRemaining)} hours remaining
                                        </span>
                                    </div>
                                    <p className="text-sm text-red-300">
                                        Your account and all associated content will be permanently deleted after 48 hours.
                                    </p>
                                </div>

                                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                                    <p className="text-sm text-yellow-200">
                                        <span className="font-semibold">Last Chance:</span> Contact the authorized person immediately to appeal this decision.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            }
        }
    }

    // Normal rendering for non-banned users
    return <>{children}</>;
}
