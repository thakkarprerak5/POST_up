"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, UserCheck, Star, Briefcase, Mail, Award } from "lucide-react";
import { toast } from "sonner";

interface Mentor {
    _id: string;
    fullName: string;
    email: string;
    photo?: string;
    expertise?: string[];
    bio?: string;
    type: string;
}

interface AssignMentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    projectTitle: string;
    requestType: 'student' | 'group';
    onAssignmentComplete: () => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function AssignMentorModal({
    isOpen,
    onClose,
    requestId,
    projectTitle,
    requestType,
    onAssignmentComplete,
}: AssignMentorModalProps) {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Debounced search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Filter mentors based on debounced search
    const filteredMentors = useMemo(() => {
        if (!debouncedSearchTerm) {
            return mentors;
        }

        const searchLower = debouncedSearchTerm.toLowerCase();
        return mentors.filter(
            (mentor) =>
                mentor.fullName?.toLowerCase().includes(searchLower) ||
                mentor.email?.toLowerCase().includes(searchLower) ||
                mentor.expertise?.some((exp) =>
                    exp.toLowerCase().includes(searchLower)
                ) ||
                mentor.bio?.toLowerCase().includes(searchLower)
        );
    }, [mentors, debouncedSearchTerm]);

    useEffect(() => {
        if (isOpen) {
            fetchMentors();
        }
    }, [isOpen]);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/mentors");
            if (response.ok) {
                const data = await response.json();
                setMentors(data);
            } else {
                toast.error("Failed to load mentors");
            }
        } catch (error) {
            console.error("Error fetching mentors:", error);
            toast.error("Failed to load mentors");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedMentor) return;

        setAssigning(true);
        try {
            const response = await fetch(`/api/admin/assignment-requests/${requestId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    mentorId: selectedMentor._id,
                    status: "assigned",
                }),
            });

            if (response.ok) {
                toast.success(`Mentor ${selectedMentor.fullName || selectedMentor.email} assigned successfully!`);
                onAssignmentComplete();
                handleClose();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to assign mentor");
            }
        } catch (error) {
            console.error("Error assigning mentor:", error);
            toast.error("Failed to assign mentor");
        } finally {
            setAssigning(false);
        }
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedMentor(null);
        onClose();
    };

    const handleMentorSelect = (mentor: Mentor) => {
        setSelectedMentor(mentor);
    };

    const handleKeyDown = (e: React.KeyboardEvent, mentor: Mentor) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMentorSelect(mentor);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-slate-900 border-slate-800 shadow-2xl">
                {/* Header */}
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex-1">
                        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                                <UserCheck className="h-5 w-5 text-white" />
                            </div>
                            Assign Mentor
                        </CardTitle>
                        <p className="text-slate-400 mt-2 leading-relaxed">
                            <span className="font-semibold text-white">{projectTitle}</span>
                            <span className="mx-2 text-slate-600">•</span>
                            <span className="text-blue-400">{requestType === 'group' ? 'Group Project' : 'Individual Project'}</span>
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl h-10 w-10 p-0 transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-6 space-y-6 bg-slate-900">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search mentors by name, email, expertise, or bio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-14 bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white h-8 w-8 p-0 rounded-lg"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Selected Mentor Preview */}
                    {selectedMentor && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 shadow-lg shadow-blue-500/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-16 w-16 border-3 border-blue-500 shadow-lg">
                                            <AvatarImage src={selectedMentor.photo} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl">
                                                {selectedMentor.fullName?.[0] || selectedMentor.email?.[0] || 'M'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-slate-900 rounded-full p-1">
                                            <UserCheck className="h-3 w-3 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-lg">{selectedMentor.fullName || selectedMentor.email}</p>
                                        <p className="text-slate-400 text-sm flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            {selectedMentor.email}
                                        </p>
                                        {selectedMentor.expertise && selectedMentor.expertise.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {selectedMentor.expertise.slice(0, 3).map((skill, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-medium px-2 py-1"
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-2 font-bold shadow-lg shadow-blue-500/25">
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Selected
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Mentors List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-blue-400" />
                                Available Mentors
                                <span className="text-slate-400 font-normal text-base">
                                    ({filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentors'})
                                </span>
                            </h3>
                        </div>

                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-700 border-t-blue-500"></div>
                                </div>
                                <p className="text-slate-400 mt-4 font-medium">Loading mentors...</p>
                            </div>
                        ) : filteredMentors.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium text-lg">
                                    {searchTerm ? 'No mentors found' : 'No mentors available'}
                                </p>
                                {searchTerm && (
                                    <p className="text-slate-500 mt-2">
                                        Try adjusting your search terms
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredMentors.map((mentor) => (
                                    <div
                                        key={mentor._id}
                                        className={`group relative border rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
                                            selectedMentor?._id === mentor._id
                                                ? "border-blue-500 bg-gradient-to-r from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20"
                                                : "border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/5"
                                        }`}
                                        onClick={() => handleMentorSelect(mentor)}
                                        onKeyDown={(e) => handleKeyDown(e, mentor)}
                                        tabIndex={0}
                                        role="button"
                                        aria-pressed={selectedMentor?._id === mentor._id}
                                        aria-label={`Select mentor ${mentor.fullName || mentor.email}`}
                                    >
                                        {/* Selection Indicator */}
                                        {selectedMentor?._id === mentor._id && (
                                            <div className="absolute top-3 right-3">
                                                <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                                                    <UserCheck className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-14 w-14 border-2 border-slate-700 shadow-md">
                                                <AvatarImage src={mentor.photo} />
                                                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold text-lg">
                                                    {mentor.fullName?.[0] || mentor.email?.[0] || 'M'}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-bold text-white text-lg truncate">
                                                        {mentor.fullName || mentor.email || 'Mentor'}
                                                    </p>
                                                    {mentor.type === 'mentor' && (
                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-medium px-2 py-1">
                                                            <Award className="h-3 w-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <p className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">{mentor.email}</span>
                                                </p>
                                                
                                                {mentor.bio && (
                                                    <p className="text-slate-300 text-sm mb-3 line-clamp-2 leading-relaxed">
                                                        {mentor.bio}
                                                    </p>
                                                )}
                                                
                                                {mentor.expertise && mentor.expertise.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {mentor.expertise.slice(0, 4).map((skill, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="outline"
                                                                className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs font-medium px-3 py-1"
                                                            >
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                        {mentor.expertise.length > 4 && (
                                                            <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs px-3 py-1">
                                                                +{mentor.expertise.length - 4} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover/Focus Ring */}
                                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-500/30 group-focus:ring-2 group-focus:ring-blue-500/50 pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="border-t border-slate-800 p-6 bg-slate-900/50">
                    <div className="flex justify-end gap-4">
                        <Button 
                            variant="outline" 
                            onClick={handleClose} 
                            disabled={assigning}
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 h-12 px-8 rounded-xl font-semibold transition-all duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedMentor || assigning}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 h-12 px-8 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {assigning ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-5 w-5 mr-3" />
                                    Assign Mentor
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
