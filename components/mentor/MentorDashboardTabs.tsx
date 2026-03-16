"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MentorInvitations } from "@/components/mentor/MentorInvitations";
import { SupervisedProjects } from "@/components/mentor/SupervisedProjects";
import { AssignedStudents } from "@/components/mentor/AssignedStudents";
import { Badge } from "@/components/ui/badge";

interface MentorDashboardTabsProps {
    mentorId: string;
    isOwner?: boolean;
    canViewInvitations?: boolean;
    activeTab?: string;
    onTabChange?: (value: string) => void;
    invitationCount?: number;
}

export function MentorDashboardTabs({
    mentorId,
    isOwner = false,
    canViewInvitations = false,
    activeTab = "students",
    onTabChange,
    invitationCount = 0
}: MentorDashboardTabsProps) {

    // Safe default tab calculation if activeTab is not provided or valid
    const defaultTab = canViewInvitations && invitationCount > 0 ? "invitations" : "students";

    return (
        <Tabs
            defaultValue={defaultTab}
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full space-y-6"
        >
            <div className="flex items-center justify-between overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <TabsList className="bg-muted/50 p-1 h-auto rounded-xl">
                    {canViewInvitations && (
                        <TabsTrigger
                            value="invitations"
                            className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                        >
                            Invitations
                            {invitationCount > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 h-5 px-1.5 min-w-[1.25rem]">
                                    {invitationCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="students"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Assigned Students
                    </TabsTrigger>
                    <TabsTrigger
                        value="groups"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Assigned Groups
                    </TabsTrigger>
                    <TabsTrigger
                        value="projects"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                        Supervised Projects
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="min-h-[400px]">
                {canViewInvitations && (
                    <TabsContent value="invitations" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
                        <MentorInvitations mentorId={mentorId} />
                    </TabsContent>
                )}

                <TabsContent value="students" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
                    <AssignedStudents />
                </TabsContent>

                <TabsContent value="groups" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
                    {/* Reusing AssignedStudents for groups as per original code structure, 
               but ideally this should be a separate AssignedGroups component if logic diverges */}
                    <AssignedStudents />
                </TabsContent>

                <TabsContent value="projects" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
                    <SupervisedProjects mentorId={mentorId} isOwner={isOwner} />
                </TabsContent>
            </div>
        </Tabs>
    );
}
