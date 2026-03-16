"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TabValue = 'projects' | 'trending' | 'events';

interface Tab {
    value: TabValue;
    label: string;
    icon?: React.ReactNode;
}

interface SlidingTabBarProps {
    activeTab: TabValue;
    onTabChange: (tab: TabValue) => void;
    className?: string;
}

const tabs: Tab[] = [
    { value: 'projects', label: 'Projects' },
    { value: 'trending', label: 'Trending' },
    { value: 'events', label: 'Events' }
];

export function SlidingTabBar({ activeTab, onTabChange, className }: SlidingTabBarProps) {
    const activeIndex = tabs.findIndex(tab => tab.value === activeTab);

    return (
        <div className={cn("w-full max-w-md mx-auto", className)}>
            <div className="relative bg-transparent border-none rounded-full p-1">
                {/* Sliding background pill */}
                <motion.div
                    className="absolute inset-y-1 bg-white border border-gray-200 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    style={{ zIndex: 0 }}
                    initial={false}
                    animate={{
                        left: `${(activeIndex / tabs.length) * 100}%`,
                        width: `${100 / tabs.length}%`
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                    }}
                />

                {/* Tab buttons */}
                <div className="relative flex items-center">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                "flex-1 relative bg-transparent border-none px-6 py-3 text-sm font-semibold rounded-full transition-colors duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                                activeTab === tab.value
                                    ? "text-blue-600"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            style={{ zIndex: 10 }}
                        >
                            <span className="flex items-center justify-center gap-2" style={{ zIndex: 10 }}>
                                {tab.icon}
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
