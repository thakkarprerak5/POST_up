"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ProjectsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const userRole = session?.user?.type || session?.user?.role;
    const isSuperAdmin = userRole === 'super-admin';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = () => {
        setLoading(true);
        fetch("/api/admin/projects")
            .then((res) => res.json())
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to load projects");
                setLoading(false);
            });
    };

    const handleViewProject = (projectId: string) => {
        router.push(`/projects/${projectId}`);
    };

    const handleDeleteProject = async () => {
        if (!deleteModal) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/projects/${deleteModal._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Delete failed');
            }

            toast.success("Project deleted successfully");
            setDeleteModal(null);
            fetchProjects();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || "Failed to delete project");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
                    <p className="text-slate-500">Review and manage project submissions</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                    Total: {projects.length}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-900">Project Title</th>
                                <th className="px-6 py-4 font-semibold text-slate-900">Author</th>
                                <th className="px-6 py-4 font-semibold text-slate-900">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                                        Loading projects...
                                    </td>
                                </tr>
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No projects found
                                    </td>
                                </tr>
                            ) : (
                                projects.map((project: any, index: number) => (
                                    <tr key={project._id || project.id || index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900">{project.title}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {project.author?.name || project.author?.fullName || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {project.category || "Uncategorized"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const id = project._id || project.id;
                                                        if (id) {
                                                            handleViewProject(id);
                                                        } else {
                                                            console.error("Project ID missing:", project);
                                                            toast.error("Error: Project ID missing");
                                                        }
                                                    }}
                                                    className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                {isSuperAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteModal(project)}
                                                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete <strong>{deleteModal?.title}</strong>?
                            This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModal(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
