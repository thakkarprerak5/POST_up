"use client";

import { Search, ChevronDown, ArrowUpDown } from "lucide-react";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange
}: FilterBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="
                w-full 
                pl-10 
                pr-4 
                py-2 
                bg-white 
                border border-gray-300 
                text-gray-600 
                rounded-lg 
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500 
                focus:border-blue-500 
                transition-colors
                text-sm
              "
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="
              appearance-none 
              bg-white 
              border border-gray-300 
              text-gray-600 
              rounded-lg 
              px-3 
              py-2 
              pr-8 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500 
              focus:border-blue-500 
              transition-colors
              text-sm
            "
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>

        {/* Target Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="
              appearance-none 
              bg-white 
              border border-gray-300 
              text-gray-600 
              rounded-lg 
              px-3 
              py-2 
              pr-8 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500 
              focus:border-blue-500 
              transition-colors
              text-sm
            "
          >
            <option value="all">All Types</option>
            <option value="user">User</option>
            <option value="project">Project</option>
            <option value="comment">Comment</option>
            <option value="chat">Chat</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="
              appearance-none 
              bg-white 
              border border-gray-300 
              text-gray-600 
              rounded-lg 
              px-3 
              py-2 
              pr-8 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500 
              focus:border-blue-500 
              transition-colors
              text-sm
            "
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="
              appearance-none 
              bg-white 
              border border-gray-300 
              text-gray-600 
              rounded-lg 
              px-3 
              py-2 
              pr-8 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500 
              focus:border-blue-500 
              transition-colors
              text-sm
            "
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
