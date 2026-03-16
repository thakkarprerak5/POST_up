"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    Users,
    User,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Inbox,
    ChevronDown,
    Trash2,
    X,
} from "lucide-react";
import { AssignmentRequestCard } from "@/components/admin/AssignmentRequestCard";
import { RemovedStudentCard } from "@/components/admin/RemovedStudentCard";
import { AssignMentorModal } from "@/components/admin/AssignMentorModal";
import { CancelRequestModal } from "@/components/admin/CancelRequestModal";
import { toast } from "sonner";

interface AssignmentRequest {
    _id: string;
    projectTitle: string;
    projectDescription: string;
    proposalFile?: string;
    requestedToType: 'student' | 'group';
    status: 'pending' | 'assigned' | 'cancelled' | 'removed';
    createdAt: string;
    assignedAt?: string;
    requestedBy: any;
    studentId?: any;
    groupId?: any;
    groupSnapshot?: any;
    assignedMentorId?: any;
}

interface Stats {
    total: number;
    pending: number;
    assigned: number;
    cancelled: number;
    individual: number;
    group: number;
    removed: number;
}

interface RemovedStudentAssignment {
    _id: string;
    assignedToType: 'student' | 'group';
    studentId?: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
    };
    groupId?: {
        _id: string;
        name: string;
        description?: string;
    };
    projectId?: {
        _id: string;
        title: string;
        description?: string;
    };
    mentorId: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
    };
    removalReason: 'project_completed' | 'report_issue' | 'other';
    removalDetails?: string;
    removedBy: {
        _id: string;
        fullName: string;
        email: string;
    };
    removedAt: string;
    reportId?: {
        _id: string;
        title: string;
        status: string;
    };
    completedBy?: {
        _id: string;
        fullName: string;
    };
    completedAt?: string;
}

export default function AssignmentRequestsPage() {
    const [requests, setRequests] = useState<AssignmentRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<AssignmentRequest[] | RemovedStudentAssignment[]>([]);
    const [removedStudents, setRemovedStudents] = useState<RemovedStudentAssignment[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        pending: 0,
        assigned: 0,
        cancelled: 0,
        individual: 0,
        group: 0,
        removed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [filterOpen, setFilterOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const tabsListRef = useRef<HTMLDivElement>(null);
    const [activeTabRect, setActiveTabRect] = useState({ left: 0, width: 0 });

    // Modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AssignmentRequest | null>(null);
    const [cancelling, setCancelling] = useState(false);


    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [requests, removedStudents, searchTerm, statusFilter, typeFilter]);

    // Calculate dropdown position when filter opens
    useEffect(() => {
        if (filterOpen && filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8, // 8px margin
                left: rect.left + window.scrollX
            });
        }
    }, [filterOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                filterButtonRef.current &&
                !filterButtonRef.current.contains(event.target as Node)
            ) {
                setFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterOpen]);


    // Update active tab indicator position
    useEffect(() => {
        const updateActiveTabPosition = () => {
            if (tabsListRef.current) {
                const activeTrigger = tabsListRef.current.querySelector(
                    "[data-state=active]"
                ) as HTMLElement;
                if (activeTrigger && tabsListRef.current) {
                    const listRect = tabsListRef.current.getBoundingClientRect();
                    const triggerRect = activeTrigger.getBoundingClientRect();
                    const left = triggerRect.left - listRect.left;
                    const width = triggerRect.width;
                    setActiveTabRect({ left, width });
                }
            }
        };

        // Initial update
        updateActiveTabPosition();

        // Add delay for DOM updates
        const timeoutId = setTimeout(updateActiveTabPosition, 100);

        // Handle window resize
        const handleResize = () => {
            updateActiveTabPosition();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, [statusFilter]);

    // Also update on initial mount
    useEffect(() => {
        const updateInitialPosition = () => {
            if (tabsListRef.current) {
                const activeTrigger = tabsListRef.current.querySelector(
                    "[data-state=active]"
                ) as HTMLElement;
                if (activeTrigger && tabsListRef.current) {
                    const listRect = tabsListRef.current.getBoundingClientRect();
                    const triggerRect = activeTrigger.getBoundingClientRect();
                    const left = triggerRect.left - listRect.left;
                    const width = triggerRect.width;
                    setActiveTabRect({ left, width });
                }
            }
        };

        // Multiple attempts to ensure proper initialization
        updateInitialPosition();
        const timeout1 = setTimeout(updateInitialPosition, 50);
        const timeout2 = setTimeout(updateInitialPosition, 200);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, []);



    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch regular assignment requests
            const response = await fetch("/api/admin/assignment-requests");
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests || []);
                setStats(prevStats => ({
                    ...data.stats,
                    removed: prevStats.removed
                }));
            } else {
                let errorMessage = "Failed to load assignment requests";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    errorMessage = response.statusText || errorMessage;
                }
                toast.error(errorMessage);
            }

            // Fetch removed students separately
            try {
                const removedResponse = await fetch("/api/admin/removed-students");
                if (removedResponse.ok) {
                    const removedData = await removedResponse.json();
                    setRemovedStudents(removedData.assignments || []);
                    setStats(prevStats => ({
                        ...prevStats,
                        removed: removedData.stats?.total || 0
                    }));
                }
            } catch (removedError) {
                console.error("Error fetching removed students:", removedError);
            }

        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to load assignment requests");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setTypeFilter("all");
        setStatusFilter("all");
        setSearchTerm("");
        fetchRequests(); // Optionally refetch to get fresh data
    };

    // Compute stats based on current type filter
    const computeStats = () => {
        // Start with all requests (excluding removed for regular stats)
        let baseRequests = requests.filter(req => req.status !== 'removed');

        // Apply type filter to base requests
        if (typeFilter !== "all") {
            baseRequests = baseRequests.filter((req) => req.requestedToType === typeFilter);
        }

        // Count removed students with type filter
        let removedCount = removedStudents.length;
        if (typeFilter !== "all") {
            removedCount = removedStudents.filter(req => req.assignedToType === typeFilter).length;
        }

        // Calculate counts
        const newStats = {
            total: baseRequests.length,
            pending: baseRequests.filter(req => req.status === 'pending').length,
            assigned: baseRequests.filter(req => req.status === 'assigned').length,
            cancelled: baseRequests.filter(req => req.status === 'cancelled').length,
            individual: requests.filter(req => req.requestedToType === 'student' && req.status !== 'removed').length,
            group: requests.filter(req => req.requestedToType === 'group' && req.status !== 'removed').length,
            removed: removedCount,
        };

        setStats(newStats);
    };

    const applyFilters = () => {
        // Compute stats first based on type filter
        computeStats();

        // FILTER ORDER: Type → Status → Search

        // If we're on the removed tab, filter removed students
        if (statusFilter === 'removed') {
            let filtered = [...removedStudents];

            // 1. Type filter FIRST
            if (typeFilter !== "all") {
                filtered = filtered.filter((req) => req.assignedToType === typeFilter);
            }

            // 2. Search filter (no status filter needed for removed tab)
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filtered = filtered.filter(
                    (req) => {
                        const targetName = req.assignedToType === 'student'
                            ? req.studentId?.fullName?.toLowerCase()
                            : req.groupId?.name?.toLowerCase();
                        const targetEmail = req.assignedToType === 'student'
                            ? req.studentId?.email?.toLowerCase()
                            : '';
                        const projectName = req.projectId?.title?.toLowerCase();
                        const mentorName = req.mentorId?.fullName?.toLowerCase();

                        return (
                            targetName?.includes(searchLower) ||
                            targetEmail?.includes(searchLower) ||
                            projectName?.includes(searchLower) ||
                            mentorName?.includes(searchLower)
                        );
                    }
                );
            }

            setFilteredRequests(filtered);
            return;
        }

        // For regular tabs: apply filters in order
        let filtered = [...requests];

        // 1. Type filter FIRST
        if (typeFilter === "student") {
            filtered = filtered.filter((req) => req.requestedToType === "student");
        } else if (typeFilter === "group") {
            filtered = filtered.filter((req) => req.requestedToType === "group");
        }
        // if typeFilter === "all", include both types

        // 2. Status filter SECOND
        if (statusFilter !== "all") {
            filtered = filtered.filter((req) => req.status === statusFilter);
        } else {
            // For "all" tab, exclude removed requests
            filtered = filtered.filter((req) => req.status !== 'removed');
        }

        // 3. Search filter LAST
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (req) =>
                    req.projectTitle?.toLowerCase().includes(searchLower) ||
                    req.requestedBy?.fullName?.toLowerCase().includes(searchLower) ||
                    req.requestedBy?.email?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleAssignMentor = (requestId: string) => {
        const request = requests.find((r) => r._id === requestId);
        if (request) {
            setSelectedRequest(request);
            setAssignModalOpen(true);
        }
    };

    const handleViewDetails = (requestId: string) => {
        toast.info("Request details view coming soon");
    };

    const handleCancelRequest = async (requestId: string) => {
        const request = requests.find((r) => r._id === requestId);
        if (!request) return;

        const confirmed = window.confirm(
            `Are you sure you want to cancel this request?\n\nProject: ${request.projectTitle}\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        setCancelling(true);
        try {
            const response = await fetch(`/api/admin/assignment-requests/${requestId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "cancelled",
                }),
            });

            if (response.ok) {
                // Optimistic UI update
                setRequests((prev) =>
                    prev.map((req) =>
                        req._id === requestId
                            ? { ...req, status: "cancelled" as const }
                            : req
                    )
                );

                // Update stats
                setStats((prev) => ({
                    ...prev,
                    cancelled: prev.cancelled + 1,
                    pending: prev.pending - 1,
                }));

                toast.success("Request cancelled successfully");
                fetchRequests(); // Refresh the list
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to cancel request");
            }
        } catch (error) {
            console.error("Error cancelling request:", error);
            toast.error("Failed to cancel request");
        } finally {
            setCancelling(false);
        }
    };

    const handleConfirmCancel = () => {
        if (selectedRequest) {
            handleCancelRequest(selectedRequest._id);
        }
        setCancelModalOpen(false);
        setSelectedRequest(null);
    };

    const handleAssignmentComplete = () => {
        fetchRequests();
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assignment Requests</h1>
                    <p className="text-lg text-gray-500 font-medium mt-2">Review and assign mentors to student requests</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border-0 border-gray-100 shadow-md rounded-xl shadow-amber-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-[1px]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                                <p className="text-sm font-medium text-amber-600">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border-0 border-gray-100 shadow-md rounded-xl shadow-green-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-[1px]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{stats.assigned}</p>
                                <p className="text-sm font-medium text-green-600">Assigned</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border-0 border-gray-100 shadow-md rounded-xl shadow-red-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-[1px]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{stats.cancelled}</p>
                                <p className="text-sm font-medium text-red-600">Cancelled</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border-0 border-gray-100 shadow-md rounded-xl shadow-indigo-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-[1px]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm font-medium text-indigo-600">Total Requests</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Search & Filters - Ultra Premium Design */}
                <div className="relative z-50 bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 border-2 border-gray-200/60 shadow-xl rounded-2xl p-6 mb-8 hover:shadow-2xl transition-all duration-500 overflow-visible group/container">
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/container:translate-x-full transition-transform duration-1000 ease-in-out" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-4">
                        {/* Premium Search Bar */}
                        <div className="flex-1 relative group">
                            {/* Animated search icon */}
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300 group-focus-within:drop-shadow-md" />
                            </div>

                            {/* Search Input with Premium Styling */}
                            <div className="relative">
                                <Input
                                    placeholder="Search by project title, student name, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-12 h-14 bg-white/90 backdrop-blur-sm border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-base focus:shadow-blue-500/20"
                                />
                                {/* Gradient focus ring overlay */}
                                <div className="relative inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-500" />
                            </div>

                            {/* Premium Clear Button */}
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 hover:from-red-400 hover:to-red-500 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 group/clear z-10"
                                >
                                    <X className="h-4 w-4 text-gray-600 group-hover/clear:text-white transition-colors duration-300" />
                                </button>
                            )}

                            {/* Search status indicator */}
                            {searchTerm && (
                                <div className="absolute -bottom-6 left-0 text-xs text-blue-600 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                    Searching...
                                </div>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                ref={filterButtonRef}
                                onClick={() => setFilterOpen(prev => !prev)}
                                className={`appearance-none bg-white/90 backdrop-blur-sm border-2 rounded-2xl px-6 py-2 h-14 min-w-[220px] text-sm font-bold shadow-lg hover:shadow-xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 flex items-center justify-between ${typeFilter === 'all' ? 'border-gray-300 text-gray-700 hover:border-gray-400' :
                                    typeFilter === 'student' ? 'border-blue-400 text-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-500/20' :
                                        'border-purple-400 text-purple-700 bg-gradient-to-br from-purple-50 to-purple-100 shadow-purple-500/20'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    {typeFilter === 'all' ? 'All Types' :
                                        typeFilter === 'student' ? (
                                            <>
                                                <User className="h-4 w-4" />
                                                Individual
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-4 w-4" />
                                                Group
                                            </>
                                        )}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu - Positioned absolutely within relative container */}
                            {filterOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[9999]">
                                    <button
                                        onClick={() => {
                                            setTypeFilter('all');
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 transition-colors hover:bg-gray-50 ${typeFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                            }`}
                                    >
                                        <Filter className="h-4 w-4" />
                                        All Types
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTypeFilter('student');
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 transition-colors hover:bg-gray-50 ${typeFilter === 'student' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                            }`}
                                    >
                                        <User className="h-4 w-4" />
                                        Individual
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTypeFilter('group');
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 transition-colors hover:bg-gray-50 ${typeFilter === 'group' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                            }`}
                                    >
                                        <Users className="h-4 w-4" />
                                        Group
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={resetFilters}
                            disabled={loading}
                            className="h-14 w-14 p-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-400 hover:border-blue-500"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Tabs with Filled Color Backgrounds */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <div className="relative bg-gray-50 p-2">
                            <TabsList
                                ref={tabsListRef}
                                className="relative grid w-full grid-cols-5 bg-white rounded-lg p-1 gap-2 h-auto border-none"
                            >
                                {/* Animated Sliding Background Indicator */}
                                <div
                                    className="absolute top-1 h-[calc(100%-8px)] rounded-lg transition-all duration-500 ease-in-out z-0"
                                    style={{
                                        left: `${activeTabRect.left}px`,
                                        width: `${activeTabRect.width}px`,
                                        background: statusFilter === 'all' ? 'linear-gradient(to right, rgb(219, 234, 254), rgb(191, 219, 254))' :
                                            statusFilter === 'pending' ? 'linear-gradient(to right, rgb(254, 243, 199), rgb(252, 211, 77))' :
                                                statusFilter === 'assigned' ? 'linear-gradient(to right, rgb(220, 252, 231), rgb(187, 247, 208))' :
                                                    statusFilter === 'cancelled' ? 'linear-gradient(to right, rgb(254, 226, 226), rgb(252, 165, 165))' :
                                                        'linear-gradient(to right, rgb(237, 233, 254), rgb(221, 214, 254))',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    }}
                                />
                                <TabsTrigger
                                    value="all"
                                    className="relative z-10 py-2.5 px-4 rounded-lg border-none bg-transparent text-gray-600 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out hover:bg-blue-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Inbox className="h-4 w-4" />
                                        <span>All</span>
                                        <Badge
                                            variant="secondary"
                                            className={statusFilter === 'all' ? 'bg-blue-600 text-white font-bold min-w-[24px] justify-center border-0' : 'bg-gray-100 text-gray-700 font-bold min-w-[24px] justify-center border-0'}
                                        >
                                            {stats.total}
                                        </Badge>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="pending"
                                    className="relative z-10 py-2.5 px-4 rounded-lg border-none bg-transparent text-gray-600 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 font-semibold transition-all duration-300 ease-in-out hover:bg-amber-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Pending</span>
                                        <Badge
                                            variant="secondary"
                                            className={statusFilter === 'pending' ? 'bg-amber-600 text-white font-bold min-w-[24px] justify-center border-0' : 'bg-amber-200 text-amber-700 font-bold min-w-[24px] justify-center border-0'}
                                        >
                                            {stats.pending}
                                        </Badge>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="assigned"
                                    className="relative z-10 py-2.5 px-4 rounded-lg border-none bg-transparent text-gray-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 font-semibold transition-all duration-300 ease-in-out hover:bg-green-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Assigned</span>
                                        <Badge
                                            variant="secondary"
                                            className={statusFilter === 'assigned' ? 'bg-green-600 text-white font-bold min-w-[24px] justify-center border-0' : 'bg-green-200 text-green-700 font-bold min-w-[24px] justify-center border-0'}
                                        >
                                            {stats.assigned}
                                        </Badge>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="cancelled"
                                    className="relative z-10 py-2.5 px-4 rounded-lg border-none bg-transparent text-gray-600 data-[state=active]:bg-red-100 data-[state=active]:text-red-700 font-semibold transition-all duration-300 ease-in-out hover:bg-red-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        <span>Cancelled</span>
                                        <Badge
                                            variant="secondary"
                                            className={statusFilter === 'cancelled' ? 'bg-red-600 text-white font-bold min-w-[24px] justify-center border-0' : 'bg-red-200 text-red-700 font-bold min-w-[24px] justify-center border-0'}
                                        >
                                            {stats.cancelled}
                                        </Badge>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="removed"
                                    className="relative z-10 py-2.5 px-4 rounded-lg border-none bg-transparent text-gray-600 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-semibold transition-all duration-300 ease-in-out hover:bg-purple-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>Removed</span>
                                        <Badge
                                            variant="secondary"
                                            className={statusFilter === 'removed' ? 'bg-purple-600 text-white font-bold min-w-[24px] justify-center border-0' : 'bg-purple-200 text-purple-700 font-bold min-w-[24px] justify-center border-0'}
                                        >
                                            {stats.removed}
                                        </Badge>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value={statusFilter} className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-500 mt-4">Loading requests...</p>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="text-center py-32">
                                    <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {statusFilter === 'all' && 'No assignment requests found'}
                                        {statusFilter === 'pending' && 'No pending requests'}
                                        {statusFilter === 'assigned' && 'No assigned requests'}
                                        {statusFilter === 'cancelled' && 'No cancelled requests'}
                                        {statusFilter === 'removed' && 'No removed students found'}
                                    </h3>
                                    <p className="text-gray-500">
                                        {searchTerm || typeFilter !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'No requests match the current criteria'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {statusFilter === 'removed' ? (
                                        filteredRequests.map((assignment) => (
                                            <RemovedStudentCard
                                                key={assignment._id}
                                                assignment={assignment as RemovedStudentAssignment}
                                                onReassign={(assignmentId) => {
                                                    console.log('Reassign:', assignmentId);
                                                }}
                                                onViewReport={(reportId) => {
                                                    console.log('View report:', reportId);
                                                }}
                                                onViewHistory={(assignmentId) => {
                                                    console.log('View history:', assignmentId);
                                                }}
                                            />
                                        ))
                                    ) : (
                                        filteredRequests.map((request) => (
                                            <AssignmentRequestCard
                                                key={request._id}
                                                request={request as AssignmentRequest}
                                                onAssignMentor={handleAssignMentor}
                                                onViewDetails={handleViewDetails}
                                                onCancelRequest={handleCancelRequest}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Modals */}
                {selectedRequest && (
                    <AssignMentorModal
                        isOpen={assignModalOpen}
                        onClose={() => {
                            setAssignModalOpen(false);
                            setSelectedRequest(null);
                        }}
                        requestId={selectedRequest._id}
                        projectTitle={selectedRequest.projectTitle}
                        requestType={selectedRequest.requestedToType}
                        onAssignmentComplete={handleAssignmentComplete}
                    />
                )}

                {selectedRequest && (
                    <CancelRequestModal
                        isOpen={cancelModalOpen}
                        onClose={() => {
                            setCancelModalOpen(false);
                            setSelectedRequest(null);
                        }}
                        onConfirm={handleConfirmCancel}
                        projectTitle={selectedRequest.projectTitle}
                        isLoading={cancelling}
                    />
                )}
            </div>
        </div >
    );
}
