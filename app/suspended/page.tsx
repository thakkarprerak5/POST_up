"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full border-red-200 shadow-xl">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-red-100 p-4">
                            <Shield className="h-16 w-16 text-red-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-red-900">
                            Account Suspended
                        </h1>
                        <p className="text-red-700 text-lg">
                            Your account has been suspended. Content hidden.
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-3">
                        <div className="flex items-center justify-center gap-2 text-yellow-800">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-semibold text-lg">Action Required</span>
                        </div>
                        <p className="text-yellow-900 text-base">
                            Please meet the authorized person.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                        <h3 className="font-semibold text-gray-900">What this means:</h3>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                            <li>Your account is flagged for review</li>
                            <li>You cannot access features</li>
                            <li>Content hidden from public view</li>
                            <li>Please meet the authorized person</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-4">
                        <p className="text-sm text-gray-600">
                            If you believe this is a mistake, please reach out to support immediately.
                        </p>

                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            >
                                Sign in with different account
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
