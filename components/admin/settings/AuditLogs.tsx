"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Clock,
    User,
    Settings,
    Activity,
    ArrowUpDown,
    Download
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

    // Filters
    const [adminSearch, setAdminSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                adminEmail: adminSearch,
                action: actionFilter
            });
            const res = await fetch(`/api/admin/settings/audit-logs?${params}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Fetch logs error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) {
            toast.error("No logs to export");
            return;
        }

        const headers = ["Admin Name", "Admin Email", "Action", "Type", "Description", "Target ID", "Timestamp"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                `"${log.adminName || 'Admin'}"`,
                `"${log.adminEmail}"`,
                `"${log.action}"`,
                `"${log.actionType}"`,
                `"${log.description?.replace(/"/g, '""')}"`,
                `"${log.targetId}"`,
                `"${new Date(log.createdAt).toLocaleString()}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV export started");
    };

    useEffect(() => {
        fetchLogs(1);
    }, [actionFilter]); // Fetch on action filter change

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const getActionTypeColor = (type: string) => {
        switch (type) {
            case 'delete': return 'bg-red-50 text-red-700 border-red-100';
            case 'role_change': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'block': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'system_setting': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'role_change': return <ShieldAlert className="h-4 w-4" />;
            case 'system_setting': return <Settings className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <Card className="bg-white shadow-2xl border-slate-200 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardHeader className="border-b border-slate-100 pb-8 bg-gradient-to-r from-slate-50/50 to-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg text-white">
                                <Activity className="h-6 w-6" />
                            </div>
                            Administrative Audit Trail
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-2 font-medium">
                            Immutable log of all security and system configuration changes.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExportCSV}
                            className="h-11 rounded-xl border-2 font-bold text-slate-600 gap-2 hover:bg-slate-50 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-8 flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by admin email..."
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                className="h-12 pl-11 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                        <Button type="submit" className="h-12 px-6 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all">
                            Filter
                        </Button>
                    </form>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="h-12 w-full md:w-[220px] bg-slate-50 border-none rounded-xl font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Action Type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="role_change">Role Changes</SelectItem>
                            <SelectItem value="system_setting">System Settings</SelectItem>
                            <SelectItem value="delete">Deletions</SelectItem>
                            <SelectItem value="block">User Blocks</SelectItem>
                            <SelectItem value="create">Creations</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-14 font-black text-slate-400 uppercase tracking-widest text-[10px] pl-8">Initiator</TableHead>
                            <TableHead className="h-14 font-black text-slate-400 uppercase tracking-widest text-[10px]">Action Event</TableHead>
                            <TableHead className="h-14 font-black text-slate-400 uppercase tracking-widest text-[10px]">Description</TableHead>
                            <TableHead className="h-14 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right pr-8">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={4} className="h-16 bg-slate-50/20"></TableCell>
                                </TableRow>
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-60 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-slate-50 rounded-full">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-400">No activity logs found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log._id} className="group/row hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm text-slate-900 font-bold text-xs ring-1 ring-slate-100">
                                                {log.adminName?.[0] || log.adminEmail?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{log.adminName || 'System Admin'}</span>
                                                <span className="text-xs text-slate-500 font-medium">{log.adminEmail}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase border shadow-sm flex items-center gap-1.5 w-fit ${getActionTypeColor(log.actionType)}`}>
                                            {getActionIcon(log.actionType)}
                                            {log.action?.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-slate-700 line-clamp-1">{log.description}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">ID: {log.targetId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : 'N/A'}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase whitespace-nowrap">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">
                    Showing <span className="font-black text-slate-900">{logs.length}</span> of <span className="font-black text-slate-900">{pagination.total}</span> events
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => fetchLogs(pagination.page - 1)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md transition-all disabled:opacity-30"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center">
                        {Array.from({ length: Math.min(5, pagination.pages) }).map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <Button
                                    key={pageNum}
                                    variant={pagination.page === pageNum ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => fetchLogs(pageNum)}
                                    className={`h-10 w-10 text-xs font-black rounded-xl transition-all ${pagination.page === pageNum
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-500 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pagination.page >= pagination.pages || loading}
                        onClick={() => fetchLogs(pagination.page + 1)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md transition-all disabled:opacity-30"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
