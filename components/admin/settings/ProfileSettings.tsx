"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function ProfileSettings() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            photo: formData.get('photo'),
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
        };

        try {
            const res = await fetch('/api/admin/settings/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Failed to update profile');

            setMessage('Profile updated successfully');
            // Ideally re-fetch session or trigger update, but effectively nice to have
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-50/50 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Profile Settings</CardTitle>
                    </div>
                    <CardDescription className="text-slate-500 text-sm ml-12">
                        Manage your personal account details and security preferences.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Details Section */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-l-2 border-blue-500 pl-3">
                                Personal Details
                            </h4>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Display Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={session?.user?.name || ''}
                                        className="h-10 !bg-white dark:!bg-slate-70 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-lg text-slate-900 dark:text-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm font-medium transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="photo" className="text-sm font-medium text-slate-700">Avatar URL</Label>
                                    <Input
                                        id="photo"
                                        name="photo"
                                        defaultValue={session?.user?.image || ''}
                                        placeholder="https://..."
                                        className="h-10 !bg-white dark:!bg-slate-70 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-lg text-slate-900 dark:text-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm font-medium transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Security Section */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-l-2 border-blue-500 pl-3">
                                Security
                            </h4>

                            <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        className="h-10 !bg-white dark:!bg-slate-200 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-lg text-slate-900 dark:text-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm font-medium transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        className="h-10 !bg-white dark:!bg-slate-200 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-lg text-slate-900 dark:text-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm font-medium transition-all duration-200"

                                    />
                                    <p className="text-xs text-slate-500">Leave blank to keep current password.</p>
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="space-y-3">
                            {error && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            )}
                            {message && (
                                <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <p className="text-sm font-medium text-green-800">{message}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all duration-300 transform active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
