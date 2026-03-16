"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Mail, Phone, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProperBanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [banReason, setBanReason] = useState("");
    const [banTimestamp, setBanTimestamp] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState("");

    useEffect(() => {
        // Use fresh session data from auth.ts refetch logic
        if (session?.user) {
            const user = session.user as any;
            const status = user.banStatus || user.account_status || 'ACTIVE';

            // Check for both PROPER_BAN and PROPER_BANNED
            if (status !== 'PROPER_BAN' && status !== 'PROPER_BANNED') {
                router.replace('/');
                return;
            }

            // Set ban details from session if available, or fetch if missing
            if (user.banReason) setBanReason(user.banReason);
            if (user.banExpiresAt) {
                // Calculate timestamp (start time) based on expiresAt (end time)
                // Assuming 48h ban. ExpiresAt = Start + 48h. Start = ExpiresAt - 48h.
                setBanTimestamp(new Date(new Date(user.banExpiresAt).getTime() - 48 * 60 * 60 * 1000));
            } else {
                // Fallback to fetch if details missing in session
                fetch('/api/user/ban-status')
                    .then(res => res.json())
                    .then(data => {
                        setBanReason(data.banReason || 'Serious policy violation');
                        setBanTimestamp(data.ban_timestamp ? new Date(data.ban_timestamp) : new Date());
                    })
                    .catch(console.error);
            }
        }
    }, [session, router]);

    useEffect(() => {
        if (!banTimestamp) return;

        const updateCountdown = () => {
            const now = new Date();
            const deletionTime = new Date(banTimestamp.getTime() + 48 * 60 * 60 * 1000);
            const diff = deletionTime.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining("Account deletion imminent");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [banTimestamp]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Black overlay with red accents */}
            <div className="max-w-3xl w-full">
                {/* Critical Warning Icon */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-red-600 p-6 rounded-full border-4 border-red-400">
                            <XCircle className="h-24 w-24 text-white" strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border-2 border-red-600 p-8 md:p-12">
                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-black text-center text-red-500 mb-6 tracking-tight">
                        CRITICAL WARNING
                    </h1>

                    {/* Countdown */}
                    <div className="bg-red-950 border-2 border-red-600 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Clock className="h-8 w-8 text-red-400 animate-pulse" />
                            <h2 className="text-2xl font-bold text-red-400">Time Remaining</h2>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl font-mono font-black text-white mb-2">
                                {timeRemaining}
                            </div>
                            <p className="text-red-300 text-sm">
                                Until permanent account deletion
                            </p>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-950/50 border-l-4 border-red-500 p-6 mb-8">
                        <p className="text-white text-lg font-bold mb-3">
                            ⚠️ YOUR ACCOUNT WILL BE PERMANENTLY DELETED
                        </p>
                        <p className="text-red-200 mb-2">
                            You must meet with the authorized person within 48 hours to prevent permanent account deletion.
                        </p>
                        <p className="text-red-300 text-sm">
                            All your data, posts, projects, and content will be permanently removed with NO recovery option.
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-red-400 mb-3">Reason for Ban</h2>
                        <div className="bg-gray-900 rounded-lg p-4 border border-red-800">
                            <p className="text-white">{banReason}</p>
                        </div>
                    </div>

                    {/* Urgent Instructions */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-red-400 mb-4">IMMEDIATE ACTION REQUIRED</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 bg-gray-900 p-4 rounded-lg border border-red-800">
                                <div className="bg-red-600 p-3 rounded-lg mt-1">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-1">Contact Immediately</p>
                                    <p className="text-gray-300 text-sm">
                                        Email or call the authorized person NOW to schedule an urgent meeting.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 bg-gray-900 p-4 rounded-lg border border-red-800">
                                <div className="bg-red-600 p-3 rounded-lg mt-1">
                                    <Phone className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-1">Meet in Person</p>
                                    <p className="text-gray-300 text-sm">
                                        Arrange to meet with the authorized person to resolve this matter before the deadline.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-red-950 rounded-xl p-6 border-2 border-red-600">
                        <h3 className="font-bold text-red-400 mb-4 text-lg">EMERGENCY CONTACT</h3>
                        <div className="space-y-2 text-white">
                            <p><span className="font-bold text-red-300">Email:</span> admin@postup.com</p>
                            <p><span className="font-bold text-red-300">Phone:</span> +1 (555) 123-4567</p>
                            <p><span className="font-bold text-red-300">Office:</span> Available 24/7 for critical cases</p>
                        </div>
                    </div>

                    {/* Final Warning */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold">
                            <AlertTriangle className="h-5 w-5" />
                            <span>FAILURE TO ACT WILL RESULT IN PERMANENT DELETION</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
