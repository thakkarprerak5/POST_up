"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserCheck, UserX, Eye, Mail, Calendar, ChevronDown, RefreshCw, Layers } from "lucide-react";
import Link from 'next/link';

interface Student {
    id: string;
    _id: string; // Keep for compatibility
    fullName?: string;
    name?: string;
    email: string;
    photo?: string;
    joinedAt: string;
}

interface Group {
    id: string;
    name: string;
    description: string;
    studentCount: number;
    assignedAt: string;
}

interface Mentor {
    _id: string;
    mentorId: string; // API returns this
    fullName?: string;
    name?: string;
    email: string;
    photo?: string;
    avatar?: string;
    skills?: string[];
    expertise?: string;
    status?: "active" | "inactive";
    students?: Student[];
    groups?: Group[];
    totalStudents?: number;
    totalGroups?: number;
    createdAt: string;

    // Preview data from API
    assignedStudentsCount?: number;
    assignedGroupsCount?: number;
    assignedStudentsPreview?: any[];
    assignedGroupsPreview?: any[];
    expertiseTags?: string[];
    availabilityStatus?: string;
    profilePhoto?: string;
}

export default function MentorsPage() {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [mentorDetailsLoading, setMentorDetailsLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/admin/mentors")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                // Map API data to component state
                const mappedMentors = data.map((mentor: any) => ({
                    _id: mentor.mentorId, // Use mentorId as _id
                    mentorId: mentor.mentorId,
                    fullName: mentor.name,
                    name: mentor.name,
                    email: mentor.email,
                    photo: mentor.profilePhoto,
                    avatar: mentor.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name || "Unknown")}&background=3B82F6&color=fff`,
                    skills: mentor.expertiseTags,
                    expertise: mentor.expertiseTags,
                    status: mentor.availabilityStatus === 'available' ? 'active' : 'inactive',
                    students: [], // Loaded on demand
                    groups: [], // Loaded on demand
                    totalStudents: mentor.assignedStudentsCount || 0,
                    totalGroups: mentor.assignedGroupsCount || 0,
                    createdAt: new Date().toISOString(), // Fallback

                    // Keep previews
                    assignedStudentsPreview: mentor.assignedStudentsPreview,
                    assignedGroupsPreview: mentor.assignedGroupsPreview
                }));

                setMentors(mappedMentors);
                setFilteredMentors(mappedMentors);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let filtered = mentors;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(mentor =>
                (mentor.fullName || mentor.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (Array.isArray(mentor.skills) ? mentor.skills.join(', ') : (mentor.skills || mentor.expertise || "")).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(mentor => mentor.status === statusFilter);
        }

        setFilteredMentors(filtered);
    }, [mentors, searchTerm, statusFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getStatusBadge = (status: "active" | "inactive") => {
        return (
            <Badge
                variant="outline"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
            >
                {status === "active" ? (
                    <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Active
                    </span>
                ) : (
                    <span className="flex items-center gap-1">
                        <UserX className="w-3 h-3" />
                        Inactive
                    </span>
                )}
            </Badge>
        );
    };

    const renderStudentAvatarsPreview = (previewStudents: any[]) => {
        if (!previewStudents || previewStudents.length === 0) return null;

        return (
            <div className="flex -space-x-2">
                {previewStudents.slice(0, 4).map((student) => (
                    <div
                        key={student.studentId || student._id}
                        className="relative group"
                        title={student.name || student.fullName}
                    >
                        <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                            <AvatarImage
                                src={student.photo}
                                className="object-cover"
                            />
                            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                                {(student.name || student.fullName || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                ))}
            </div>
        );
    };

    const getMentorName = (mentor: Mentor) => mentor.fullName || mentor.name || "Unknown";

    const fetchMentorDetails = async (mentorId: string) => {
        setMentorDetailsLoading(true);
        // Set selected mentor immediately with basic info while loading details
        const mentor = mentors.find(m => m._id === mentorId);
        if (mentor) {
            setSelectedMentor(mentor); // Show modal with basic data first
        }

        try {
            // Fetch detailed information
            const response = await fetch(`/api/admin/mentors/${mentorId}/students`);
            if (response.ok) {
                const detailedData = await response.json();

                // Update selected mentor with details
                setSelectedMentor(prev => {
                    if (!prev || prev._id !== mentorId) return prev;
                    return {
                        ...prev,
                        students: detailedData.students || [],
                        groups: detailedData.groups || [],
                        totalStudents: detailedData.totalStudents || 0,
                        totalGroups: detailedData.totalGroups || 0
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching mentor details:', error);
        } finally {
            setMentorDetailsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30 mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Mentors</h1>
                        <p className="mt-2 text-lg text-gray-600 font-light leading-relaxed">
                            Manage mentor accounts and their student assignments
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 shadow px-4 py-2 text-sm font-medium">
                            <Users className="w-4 h-4 mr-2" />
                            {mentors.length} Total Mentors
                        </Badge>
                        <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/50 shadow px-4 py-2 text-sm font-medium">
                            <UserCheck className="w-4 h-4 mr-2" />
                            {mentors.filter(m => m.status === "active").length} Active
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 mb-12">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-5">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
                            <Input
                                placeholder="Search mentors by name, email, or expertise..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-14 h-14 bg-white !bg-white border-2 border-blue-500 text-slate-900 placeholder:text-slate-500 rounded-xl shadow-md focus:border-blue-600 font-medium text-base hover:shadow-lg transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setFilterOpen(prev => !prev)}
                                className="appearance-none bg-white border-2 border-blue-500 rounded-full px-6 py-3 pr-12 h-14 min-w-[220px] text-base font-semibold text-slate-900 shadow-sm hover:shadow-md cursor-pointer hover:border-blue-600 flex items-center justify-between transition-all"
                            >
                                <span>
                                    {statusFilter === 'all' ? 'All Status' :
                                        statusFilter === 'active' ? 'Active' : 'Inactive'}
                                </span>
                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {filterOpen && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-blue-100/50 rounded-3xl shadow-2xl shadow-blue-500/25 z-50 overflow-hidden animate-in slide-in-from-top-1">
                                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-1">
                                        <div className="bg-white rounded-2xl">
                                            {['all', 'active', 'inactive'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setStatusFilter(opt as any); setFilterOpen(false); }}
                                                    className={`w-full px-6 py-4 text-left font-semibold border-b border-blue-50 last:border-b-0 transition-colors ${statusFilter === opt ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-blue-50/50'}`}
                                                >
                                                    {opt === 'all' ? 'All Status' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => window.location.reload()}
                            disabled={loading}
                            className="h-14 w-14 p-0 rounded-full hover:bg-blue-50 border-2 border-blue-500 hover:border-blue-600 text-blue-600"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200/30 text-center animate-pulse">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading mentors...</h3>
                </div>
            )}

            {/* Mentor Cards Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMentors.map((mentor) => (
                        <div
                            key={mentor._id}
                            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer group"
                            onClick={() => fetchMentorDetails(mentor._id)}
                        >
                            {/* Mentor Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                                        <AvatarImage src={mentor.avatar} className="object-cover" />
                                        <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                                            {getMentorName(mentor).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {getMentorName(mentor)}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                            <Mail className="w-3 h-3" />
                                            {mentor.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mb-4">
                                {getStatusBadge(mentor.status || "active")}
                            </div>

                            {/* Expertise */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Expertise</h4>
                                <div className="flex flex-wrap gap-2">
                                    {((Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills || mentor.expertise || "").split(','))).slice(0, 3).map((skill: string, idx: number) => (
                                        skill && <Badge key={idx} variant="outline" className="text-xs">{skill.trim()}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Joined {new Date(mentor.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Assignments Section */}
                            <div className="border-t border-gray-200/40 pt-6">
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                                        <div className="text-xl font-bold text-blue-700">{mentor.totalStudents || 0}</div>
                                        <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Students</div>
                                    </div>
                                    <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                                        <div className="text-xl font-bold text-green-700">{mentor.totalGroups || 0}</div>
                                        <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Groups</div>
                                    </div>
                                </div>

                                {/* Previews */}
                                {(mentor.assignedStudentsPreview && mentor.assignedStudentsPreview.length > 0) ? (
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500">Recent Assignments:</div>
                                        {renderStudentAvatarsPreview(mentor.assignedStudentsPreview)}
                                    </div>
                                ) : (
                                    <div className="text-center text-xs text-gray-400 py-2">No active assignments</div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 pt-4 border-t border-gray-200/40">
                                <Button
                                    variant="outline"
                                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Full Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mentor Details Modal */}
            {selectedMentor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={selectedMentor.avatar} />
                                    <AvatarFallback>{getMentorName(selectedMentor).charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{getMentorName(selectedMentor)}</h2>
                                    <p className="text-sm text-gray-500">{selectedMentor.email}</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setSelectedMentor(null)}>✕</Button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-blue-700">{selectedMentor.totalStudents}</div>
                                    <div className="text-sm font-medium text-blue-600">Total Students</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-green-700">{selectedMentor.totalGroups}</div>
                                    <div className="text-sm font-medium text-green-600">Total Groups</div>
                                </div>
                            </div>

                            {/* Groups Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-green-600" />
                                    Assigned Groups
                                </h3>
                                {mentorDetailsLoading ? (
                                    <div className="text-center py-4 text-gray-500">Loading details...</div>
                                ) : (selectedMentor.groups && selectedMentor.groups.length > 0) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedMentor.groups.map(group => (
                                            <div key={group.id} className="border border-green-100 bg-green-50/30 rounded-xl p-4 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-gray-900">{group.name}</h4>
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">{group.studentCount} Members</Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{group.description || "No description"}</p>
                                                <div className="flex justify-between items-center mt-auto">
                                                    <span className="text-xs text-gray-400">Assigned: {new Date(group.assignedAt).toLocaleDateString()}</span>
                                                    <Link href={`/mentor/groups/${group.id}`} target="_blank">
                                                        <Button size="sm" variant="outline" className="h-8 text-xs">View Group</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">No groups assigned</p>
                                    </div>
                                )}
                            </div>

                            {/* Students Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Assigned Students
                                </h3>
                                {mentorDetailsLoading ? (
                                    <div className="text-center py-4 text-gray-500">Loading details...</div>
                                ) : (selectedMentor.students && selectedMentor.students.length > 0) ? (
                                    <div className="bg-white border rounded-xl overflow-hidden">
                                        {selectedMentor.students.map((student, idx) => (
                                            <div key={student.id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={student.photo} />
                                                        <AvatarFallback>{(student.fullName?.[0] || 'U')}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{student.fullName || student.name}</div>
                                                        <div className="text-sm text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    Joined {new Date(student.joinedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">No individual students assigned</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
