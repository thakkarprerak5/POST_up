"use client";

import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/admin/settings/ProfileSettings";
import PlatformSettings from "@/components/admin/settings/PlatformSettings";
import RoleManagement from "@/components/admin/settings/RoleManagement";
import SecuritySettings from "@/components/admin/settings/SecuritySettings";
import AuditLogs from "@/components/admin/settings/AuditLogs";
import { Shield, User, Settings, Lock, FileText } from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role || (session?.user as any)?.type;
    const isSuperAdmin = role === 'super-admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your account and platform preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 p-0 w-full justify-start h-auto rounded-none space-x-2">
                    <TabsTrigger
                        value="profile"
                        className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-t-md border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
                    >
                        <User className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
                        <span>Profile</span>
                    </TabsTrigger>

                    {isSuperAdmin && (
                        <>
                            <TabsTrigger
                                value="platform"
                                className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-t-md border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
                            >
                                <Settings className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
                                <span>Platform</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="roles"
                                className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-t-md border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
                            >
                                <Shield className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
                                <span>Roles & Permissions</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-t-md border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
                            >
                                <Lock className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
                                <span>Security</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="audit"
                                className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-t-md border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
                            >
                                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
                                <span>Audit Logs</span>
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettings />
                </TabsContent>

                {isSuperAdmin && (
                    <>
                        <TabsContent value="platform">
                            <PlatformSettings />
                        </TabsContent>
                        <TabsContent value="roles">
                            <RoleManagement />
                        </TabsContent>
                        <TabsContent value="security">
                            <SecuritySettings />
                        </TabsContent>
                        <TabsContent value="audit">
                            <AuditLogs />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
