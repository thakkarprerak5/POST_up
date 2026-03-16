"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, UserCheck, UserX, Filter, Eye, Mail, Star } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  expertise: string[];
  status: "active" | "inactive";
  students: Student[];
  totalStudents: number;
  joinDate: string;
  rating?: number;
}

// Mock data - replace with actual API call
const mockMentors: Mentor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3B82F6&color=fff",
    expertise: ["Web Development", "React", "Node.js"],
    status: "active",
    students: [
      { id: "s1", name: "Alex Chen", email: "alex.chen@student.edu", joinedAt: "2024-01-15" },
      { id: "s2", name: "Maria Garcia", email: "maria.garcia@student.edu", joinedAt: "2024-01-20" },
      { id: "s3", name: "James Wilson", email: "james.wilson@student.edu", joinedAt: "2024-02-01" },
      { id: "s4", name: "Emma Davis", email: "emma.davis@student.edu", joinedAt: "2024-02-10" },
    ],
    totalStudents: 4,
    joinDate: "2023-06-15",
    rating: 4.8
  },
  {
    id: "2", 
    name: "Prof. Michael Chen",
    email: "michael.chen@tech.edu",
    avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=10B981&color=fff",
    expertise: ["Machine Learning", "Python", "Data Science"],
    status: "active",
    students: [
      { id: "s5", name: "Lisa Wang", email: "lisa.wang@student.edu", joinedAt: "2024-01-10" },
      { id: "s6", name: "Robert Kim", email: "robert.kim@student.edu", joinedAt: "2024-01-25" },
    ],
    totalStudents: 2,
    joinDate: "2023-08-20",
    rating: 4.9
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@design.edu",
    avatar: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=8B5CF6&color=fff",
    expertise: ["UI/UX Design", "Figma", "Frontend"],
    status: "active",
    students: [
      { id: "s7", name: "David Lee", email: "david.lee@student.edu", joinedAt: "2024-02-05" },
      { id: "s8", name: "Sophie Martin", email: "sophie.martin@student.edu", joinedAt: "2024-02-12" },
      { id: "s9", name: "Ryan Thompson", email: "ryan.thompson@student.edu", joinedAt: "2024-02-15" },
      { id: "s10", name: "Olivia Brown", email: "olivia.brown@student.edu", joinedAt: "2024-02-20" },
      { id: "s11", name: "Nathan White", email: "nathan.white@student.edu", joinedAt: "2024-02-25" },
      { id: "s12", name: "Grace Liu", email: "grace.liu@student.edu", joinedAt: "2024-03-01" },
    ],
    totalStudents: 6,
    joinDate: "2023-09-10",
    rating: 4.7
  },
  {
    id: "4",
    name: "Dr. James Mitchell",
    email: "james.mitchell@business.edu",
    avatar: "https://ui-avatars.com/api/?name=James+Mitchell&background=F59E0B&color=fff",
    expertise: ["Business Strategy", "Leadership", "Management"],
    status: "inactive",
    students: [
      { id: "s13", name: "Daniel Park", email: "daniel.park@student.edu", joinedAt: "2023-12-01" },
    ],
    totalStudents: 1,
    joinDate: "2023-07-01",
    rating: 4.6
  }
];

export default function MentorManagementPage() {
  const [mentors, setMentors] = useState<Mentor[]>(mockMentors);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>(mockMentors);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    let filtered = mentors;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(mentor =>
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(mentor => mentor.status === statusFilter);
    }

    setFilteredMentors(filtered);
  }, [mentors, searchTerm, statusFilter]);

  const getStatusBadge = (status: "active" | "inactive") => {
    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          status === "active"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-50 text-slate-600 border-slate-200"
        }`}
      >
        {status === "active" ? (
          <>
            <UserCheck className="w-3 h-3" />
            Active
          </>
        ) : (
          <>
            <UserX className="w-3 h-3" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  const renderStudentAvatars = (students: Student[]) => {
    const displayStudents = students.slice(0, 4);
    const remainingCount = students.length - displayStudents.length;

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {displayStudents.map((student, index) => (
            <div
              key={student.id}
              className="relative group"
              title={`${student.name} - ${student.email}`}
            >
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                <AvatarImage
                  src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366F1&color=fff`}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full border-2 border-white shadow-sm">
            <span className="text-xs font-medium text-slate-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Mentor Management</h1>
            <p className="mt-2 text-lg text-gray-600 font-light leading-relaxed">
              Manage mentors and their student assignments
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

      {/* Filters */}
      <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-gray-200/30 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search mentors by name, email, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white/50 border-gray-200/60 focus:border-blue-300 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              Status:
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="w-32 h-12 bg-white/50 border-gray-200/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mentor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <div
            key={mentor.id}
            className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30 cursor-pointer"
            onClick={() => {
              // Handle mentor detail view
              console.log("View mentor details:", mentor.id);
            }}
          >
            {/* Mentor Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                  <AvatarImage
                    src={mentor.avatar}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-lg">
                    {mentor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {mentor.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {mentor.email}
                  </p>
                </div>
              </div>
              {getStatusBadge(mentor.status)}
            </div>

            {/* Expertise */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200/50 text-xs font-medium"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Rating */}
            {mentor.rating && (
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-gray-900">{mentor.rating}</span>
                  <span className="text-xs text-gray-500">Rating</span>
                </div>
              </div>
            )}

            {/* Students Section */}
            <div className="border-t border-gray-200/40 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Students Under Mentorship
                </h4>
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200/50 text-xs font-medium"
                >
                  {mentor.totalStudents} Total
                </Badge>
              </div>
              
              {mentor.students.length > 0 ? (
                <div>
                  {renderStudentAvatars(mentor.students)}
                  <div className="mt-4 space-y-2">
                    {mentor.students.slice(0, 3).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366F1&color=fff`}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-gray-700">{student.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(student.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No students assigned</p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-gray-200/40">
              <Button
                variant="outline"
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-blue-200/50 font-medium group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("View full details:", mentor.id);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMentors.length === 0 && (
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-12 shadow-lg border border-gray-200/30 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No mentors found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No mentors have been added to the system yet"}
          </p>
        </div>
      )}
    </div>
  );
}
