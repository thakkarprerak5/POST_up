"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
    rank: number;
    className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
    // Top 3 get special treatment
    if (rank === 1) {
        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900",
                "shadow-lg shadow-yellow-500/50 border border-yellow-600",
                "font-bold text-sm",
                className
            )}>
                <Trophy className="h-4 w-4" />
                <span>#1</span>
            </div>
        );
    }

    if (rank === 2) {
        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900",
                "shadow-lg shadow-gray-400/50 border border-gray-500",
                "font-bold text-sm",
                className
            )}>
                <Medal className="h-4 w-4" />
                <span>#2</span>
            </div>
        );
    }

    if (rank === 3) {
        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900",
                "shadow-lg shadow-orange-500/50 border border-orange-600",
                "font-bold text-sm",
                className
            )}>
                <Award className="h-4 w-4" />
                <span>#3</span>
            </div>
        );
    }

    // Ranks 4-10 get blue gradient
    if (rank <= 10) {
        return (
            <div className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full",
                "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                "shadow-md shadow-blue-500/30 border border-blue-700",
                "font-semibold text-sm",
                className
            )}>
                <span>#{rank}</span>
            </div>
        );
    }

    // Ranks 11+ get simple gray badge
    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
            "bg-gray-200 text-gray-700 border border-gray-300",
            "font-medium text-xs",
            className
        )}>
            <span>#{rank}</span>
        </div>
    );
}
