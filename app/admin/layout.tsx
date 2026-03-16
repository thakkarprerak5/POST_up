"use client";

import { useSession } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { redirect } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Loading admin panel...</div>;
    }

    if (!session) {
        return null; //- Middleware handles redirect
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Static, Flex Item */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-8 relative bg-white">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
