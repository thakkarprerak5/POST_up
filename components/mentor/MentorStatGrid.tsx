"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, TrendingUp, Calendar } from "lucide-react";

interface MentorStats {
    totalStudents: number;
    totalGroups: number;
    totalAssignments: number;
    pendingInvitations: number;
}

interface MentorStatGridProps {
    stats: MentorStats;
}

export function MentorStatGrid({ stats }: MentorStatGridProps) {
    const statItems = [
        {
            label: "Assigned Students",
            value: stats.totalStudents,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-200/50"
        },
        {
            label: "Assigned Groups",
            value: stats.totalGroups,
            icon: GraduationCap,
            color: "text-green-600",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-200/50"
        },
        {
            label: "Total Assignments",
            value: stats.totalAssignments,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-200/50"
        },
        {
            label: "Pending Invitations",
            value: stats.pendingInvitations,
            icon: Calendar,
            color: "text-orange-600",
            bgColor: "bg-orange-500/10",
            borderColor: "border-orange-200/50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statItems.map((item, index) => (
                <Card key={index} className="bg-card border-border/60 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{item.value}</p>
                            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
