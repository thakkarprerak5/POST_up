"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
    return (
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Platform Administration</span>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                    <Bell className="w-4 h-4" />
                </Button>
            </div>
        </header>
    );
}
