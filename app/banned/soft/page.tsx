"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SoftBanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [banReason, setBanReason] = useState("");

    useEffect(() => {
        // Fetch user ban details
        if (session?.user) {
            fetch('/api/user/ban-status')
                .then(res => res.json())
                .then(data => {
                    if (data.account_status !== 'SOFT_BANNED') {
                        // User is not soft banned, redirect to home
                        router.push('/');
                    } else {
                        setBanReason(data.banReason || 'Policy violation');
                    }
                })
                .catch(err => console.error('Failed to fetch ban status:', err));
        }
    }, [session, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <AlertTriangle className="h-16 w-16 text-yellow-600" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                    Account Suspended
                </h1>

                {/* Message */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="text-yellow-800 font-medium mb-2">
                        Your account has been temporarily suspended.
                    </p>
                    <p className="text-yellow-700 text-sm">
                        All your content is currently hidden from other users.
                    </p>
                </div>

                {/* Reason */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Reason for Suspension</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{banReason}</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">What You Need to Do</h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg mt-1">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Contact the Authorized Person</p>
                                <p className="text-sm text-gray-600">
                                    Please reach out to the platform administrator to discuss this suspension.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-lg mt-1">
                                <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Schedule a Meeting</p>
                                <p className="text-sm text-gray-600">
                                    Arrange a time to meet with the authorized person to resolve this issue.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Email:</span> admin@postup.com</p>
                        <p><span className="font-medium">Office Hours:</span> Monday - Friday, 9:00 AM - 5:00 PM</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Your account will remain suspended until this matter is resolved.
                    </p>
                </div>
            </div>
        </div>
    );
}
