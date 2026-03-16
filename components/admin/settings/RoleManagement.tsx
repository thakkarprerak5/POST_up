"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCog, Search, Mail, XCircle, Shield, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function RoleManagement() {
    const [email, setEmail] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingRole, setPendingRole] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setUser(null);
        setError('');

        try {
            const res = await fetch(`/api/admin/users/find?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'User not found');
                return;
            }

            setUser(data);
            toast.success('User found');
        } catch (err: any) {
            console.error('Search error:', err);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const initiateRoleUpdate = (role: string) => {
        setPendingRole(role);
        setIsConfirmOpen(true);
    };

    const handleRoleUpdate = async () => {
        if (!user || !pendingRole) return;
        setUpdating(true);
        setIsConfirmOpen(false);

        try {
            const res = await fetch(`/api/admin/users/${user._id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: pendingRole }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update role');

            toast.success(`Role updated successfully to ${pendingRole}`);
            setUser({ ...user, type: pendingRole });
        } catch (err: any) {
            console.error('Update error:', err);
            toast.error(err.message || 'Failed to update role');
        } finally {
            setUpdating(false);
            setPendingRole(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super-admin': return 'from-red-50 to-orange-50 text-red-700 border-red-200';
            case 'admin': return 'from-blue-50 to-indigo-50 text-blue-700 border-blue-200';
            case 'mentor': return 'from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200';
            default: return 'from-slate-50 to-gray-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-white shadow-xl border-slate-200 rounded-3xl overflow-hidden transition-all duration-300">
                <CardHeader className="border-b border-slate-100 pb-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl ring-4 ring-blue-50">
                            <UserCog className="h-8 w-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">System Role Control</CardTitle>
                            <CardDescription className="text-slate-500 mt-1 font-medium italic">
                                Elevate or restrict user access levels across the platform.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-10 px-10 space-y-10">
                    {/* Search Section */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-8 bg-white rounded-2xl border border-slate-200 space-y-5 shadow-sm">
                            <Label htmlFor="email" className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                User Identification
                            </Label>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter user email address..."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="h-14 bg-slate-50/50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition-all rounded-xl pl-12 text-slate-900 font-semibold"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading || !email.trim()}
                                    className="h-14 px-8 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Identify"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <p className="text-red-900 font-bold text-sm tracking-wide">{error}</p>
                        </div>
                    )}

                    {/* User Profile Card */}
                    {user && (
                        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className={`p-8 bg-gradient-to-r ${getRoleBadgeColor(user.type)} flex justify-between items-center border-b border-inherit`}>
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-slate-900 text-2xl font-black ring-4 ring-white/50">
                                        {user.fullName?.[0] || user.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-2xl text-slate-900 tracking-tight">{user.fullName}</h4>
                                        <p className="text-slate-700 opacity-70 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <Badge className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase border-2 shadow-sm bg-white`}>
                                    {user.type}
                                </Badge>
                            </div>

                            <div className="p-10 bg-white space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Authority Assignment
                                        </Label>
                                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                            SECURE ACTION REQUIRED
                                        </div>
                                    </div>

                                    <Select
                                        value={user.type}
                                        onValueChange={initiateRoleUpdate}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="h-16 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition-all rounded-2xl font-bold text-slate-900 text-lg px-6 ring-offset-blue-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl p-2 shadow-2xl border-slate-100">
                                            <SelectItem value="student" className="h-12 rounded-xl font-bold focus:bg-blue-50 hover:translate-x-1 transition-transform">
                                                👨‍🎓 Student
                                            </SelectItem>
                                            <SelectItem value="mentor" className="h-12 rounded-xl font-bold focus:bg-emerald-50 hover:translate-x-1 transition-transform">
                                                👨‍🏫 Mentor
                                            </SelectItem>
                                            <SelectItem value="admin" className="h-12 rounded-xl font-bold focus:bg-indigo-50 hover:translate-x-1 transition-transform">
                                                🛡️ Administrator
                                            </SelectItem>
                                            <SelectItem value="super-admin" className="h-12 rounded-xl font-bold focus:bg-red-50 hover:translate-x-1 transition-transform">
                                                ⚡ Super Admin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Info className="h-5 w-5 text-slate-400" />
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Upgrading to <strong>Administrator</strong> or <strong>Super Admin</strong> grants bypass permissions for all content moderation and user management systems.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="rounded-3xl p-8 max-w-md border-none shadow-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-blue-50/50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <DialogHeader className="relative">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                            <Shield className="h-8 w-8 text-red-600 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900">Security Confirmation</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2 leading-relaxed">
                            You are about to change <strong>{user?.fullName}</strong>&apos;s role to <span className="text-slate-900 font-black uppercase tracking-wider">{pendingRole}</span>.
                            <br /><br />
                            This action will be permanent and will be logged as an administrative security event. Do you wish to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="relative gap-3 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                            className="flex-1 h-14 border-2 border-slate-100 hover:bg-slate-50 rounded-2xl font-bold text-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRoleUpdate}
                            className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                        >
                            Proceed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
