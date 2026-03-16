import { notFound } from "next/navigation"
import { headers } from "next/headers"
import Image from "next/image"
import Link from "next/link";
import { Users, FileText, Calendar, Shield, ExternalLink, Github, Globe, Search, ArrowLeft, Mail, Award, Download, Building } from "lucide-react";


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types based on API response
interface GroupMember {
    _id: string
    fullName: string
    email: string
    photo: string
    type: string
}

interface GroupData {
    id: string
    name: string
    description: string
    lead: GroupMember
    members: GroupMember[]
    createdAt: string
}

interface ProjectData {
    id: string
    title: string
    description: string
    status: string
    repoUrl: string
    liveUrl: string
    tags: string[]
    images: string[]
    proposalFile: string
    createdAt: string
}

async function getGroupData(groupId: string) {
    try {
        // Determine base URL based on environment or default to localhost
        // In server components, we need an absolute URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const headersList = await headers();

        const res = await fetch(`${baseUrl}/api/groups/${groupId}`, {
            cache: 'no-store',
            headers: headersList
        })

        if (!res.ok) {
            if (res.status === 404) return null
            throw new Error('Failed to fetch group data')
        }

        return res.json()
    } catch (error) {
        console.error("Error fetching group data:", error)
        return null
    }
}

export default async function GroupWorkspacePage({ params }: { params: { groupId: string } }) {
    const { groupId } = await params
    const data = await getGroupData(groupId)

    if (!data || !data.group) {
        return notFound()
    }

    const { group, project } = data as { group: GroupData; project: ProjectData | null }

    // Safe fallback for members if it's undefined
    const members = group.members || []

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Premium Header / Hero Section */}
            <div className="bg-white border-b border-[#E2E8F0] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-2 text-sm text-[#64748B] mb-4">
                        <Link href="/profile" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" />
                            Back to Dashboard
                        </Link>
                        <span>/</span>
                        <span>Groups</span>
                        <span>/</span>
                        <span className="font-medium text-[#0F172A]">{group.name}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">{group.name}</h1>
                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-0 px-3 py-1 text-sm font-medium rounded-full">
                                    Active Group
                                </Badge>
                            </div>
                            <p className="text-[#64748B] text-lg max-w-2xl">
                                {group.description || "No description provided for this group."}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Project Status</p>
                                <p className="font-semibold text-[#0F172A]">{project?.status || 'Pending'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

                {/* Project & Proposal Section */}
                {project ? (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Award className="h-4 w-4 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-[#0F172A]">Assigned Project</h2>
                        </div>

                        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                            <div className="grid md:grid-cols-3 gap-0">
                                <div className="md:col-span-2 p-8 border-r border-[#E2E8F0]">
                                    <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{project.title}</h3>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {project.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 px-3 py-1">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <p className="text-[#64748B] leading-relaxed mb-8">
                                        {project.description}
                                    </p>

                                    <div className="flex items-center gap-4">
                                        {project.repoUrl && (
                                            <Button variant="outline" className="border-[#E2E8F0] text-[#475569] hover:bg-slate-50 gap-2" asChild>
                                                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                                                    <Github className="h-4 w-4" />
                                                    View Repository
                                                </a>
                                            </Button>
                                        )}
                                        {project.liveUrl && (
                                            <Button variant="outline" className="border-[#E2E8F0] text-[#475569] hover:bg-slate-50 gap-2" asChild>
                                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="h-4 w-4" />
                                                    Live Demo
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-8 flex flex-col justify-center items-center text-center">
                                    {project.proposalFile ? (
                                        <div className="space-y-4 w-full max-w-xs">
                                            <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-blue-600">
                                                <FileText className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#0F172A]">Project Proposal</h4>
                                                <p className="text-sm text-[#64748B]">Review the detailed project plan</p>
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" asChild>
                                                <a href={project.proposalFile} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download Proposal
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                <FileText className="h-8 w-8" />
                                            </div>
                                            <p className="text-[#64748B] font-medium">No proposal document uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </section>
                ) : (
                    <Alert className="bg-blue-50 border-blue-100">
                        <AlertTitle className="text-blue-800 font-semibold">No Project Assigned</AlertTitle>
                        <AlertDescription className="text-blue-600">
                            This group has not been assigned a project yet. Please assign a project from your dashboard.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Team Roster Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Team Roster</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Group Lead Card */}
                        {group.lead && (
                            <Card className="bg-white border-blue-200 shadow-md shadow-blue-100/50 rounded-2xl overflow-hidden relative group hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                <CardContent className="p-6">
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 px-3 py-1 pointer-events-none">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Group Lead
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4 mt-2">
                                        <div className="relative">
                                            <div className="h-16 w-16 rounded-full overflow-hidden ring-4 ring-blue-50">
                                                <Image
                                                    src={group.lead.photo || "/placeholder-user.jpg"}
                                                    alt={group.lead.fullName}
                                                    width={64}
                                                    height={64}
                                                    className="object-cover h-full w-full"
                                                />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full h-5 w-5 border-2 border-white" title="Active"></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0F172A]">{group.lead.fullName}</h3>
                                            <p className="text-sm text-[#64748B] flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {group.lead.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-[#E2E8F0]">
                                        <Button variant="ghost" className="w-full justify-between group-hover:bg-blue-50 text-[#64748B] group-hover:text-blue-700" asChild>
                                            <Link href={`/profile/${group.lead._id}`}>
                                                View Full Profile
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Other Members */}
                        {members.map((member) => (
                            // Skip if member is also the lead (duplicate check)
                            member._id !== group.lead?._id && (
                                <Card key={member._id} className="bg-white border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4 mt-2">
                                            <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                                                <Image
                                                    src={member.photo || "/placeholder-user.jpg"}
                                                    alt={member.fullName}
                                                    width={56}
                                                    height={56}
                                                    className="object-cover h-full w-full"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-lg text-[#0F172A] truncate">{member.fullName}</h3>
                                                <p className="text-sm text-[#64748B] truncate flex items-center gap-1">
                                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-2 border-t border-[#E2E8F0]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Member</span>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-full" asChild>
                                                    <Link href={`/profile/${member._id}`}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ))}

                        {members.length === 0 && !group.lead && (
                            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No Members Found</h3>
                                <p className="text-slate-500">This group currently has no assigned members.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
