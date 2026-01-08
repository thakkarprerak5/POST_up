'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Comment {
  _id: string;
  id: string;
  text?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  projectId: string;
  projectTitle: string;
  projectAuthor: string;
}

interface AdminCommentsProps {
  userRole: 'admin' | 'super_admin';
}

const AdminComments: React.FC<AdminCommentsProps> = ({ userRole }) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchComments();
  }, [filter, search, pagination.page]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filter && { filter }),
        ...(session?.user?.role && { role: session.user.role })
      });

      const response = await fetch(`/api/admin/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / prev.limit)
        }));
      } else {
        setError('Failed to fetch comments');
      }
    } catch (err) {
      setError('Error loading comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Comment deletion removed
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = search === '' || 
      (comment.text && comment.text.toLowerCase().includes(search.toLowerCase())) ||
      (comment.userName && comment.userName.toLowerCase().includes(search.toLowerCase())) ||
      (comment.projectTitle && comment.projectTitle.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    if (filter === 'flagged') return matchesSearch && comment.text && comment.text.toLowerCase().includes('spam') || comment.text && comment.text.toLowerCase().includes('inappropriate');
    if (filter === 'recent') return matchesSearch && new Date(comment.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return matchesSearch;
  });

  const paginatedComments = filteredComments.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Access Restricted</h2>
          <p className="text-black">Please sign in to access comment management.</p>
        </div>
      </div>
    );
  }

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Comment Management</h1>
        <p className="text-black mt-2">
          Manage and moderate comments across all projects
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Filters</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-black">Filters:</span>
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger
                className="
                  w-full sm:w-48
                  !bg-white text-black
                  border border-black
                  hover:!bg-white
                  focus:!bg-white
                  data-[state=open]:!bg-white
                  [&>svg]:!text-black
                  [&>svg]:!opacity-100
                "
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border border-black shadow-lg">
                <SelectItem value="all" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">
                  All Comments
                </SelectItem>
                <SelectItem value="flagged" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">
                  Flagged Content
                </SelectItem>
                <SelectItem value="recent" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">
                  Recent (24h)
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                <Input
                  placeholder="Search comments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    !bg-white text-black pl-10
                    border border-black
                    hover:!bg-white
                    focus:!bg-white
                    focus-visible:ring-0
                    focus-visible:ring-offset-0
                  "
                />
              </div>
            </div>

            <Button
              onClick={fetchComments}
              className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:border-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{comments.length}</div>
            <p className="text-xs text-black/70">Across all projects</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Filtered Results</CardTitle>
            <Filter className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{filteredComments.length}</div>
            <p className="text-xs text-black/70">Matching current filters</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {filteredComments.filter(c => new Date(c.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-black/70">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Need Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {filteredComments.filter(c => c.text && c.text.toLowerCase().includes('spam') || c.text && c.text.toLowerCase().includes('inappropriate')).length}
            </div>
            <p className="text-xs text-black/70">Potentially problematic</p>
          </CardContent>
        </Card>
      </div>

      {/* Comments Table */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Comments ({filteredComments.length})</CardTitle>
          <CardDescription className="text-black/70">
            Showing {paginatedComments.length} of {filteredComments.length} comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black">
                {paginatedComments.map((comment, index) => (
                  <tr key={comment.id || index} className="hover:bg-gray-100">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-black line-clamp-2">{comment.text}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black/70">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="text-black">View</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-t border-black">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:border-blue-600"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:border-blue-600"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-black/70">
                    Showing <span className="font-medium text-black">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium text-black">{Math.min(pagination.page * pagination.limit, filteredComments.length)}</span> of{' '}
                    <span className="font-medium text-black">{filteredComments.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`
                          relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${
                            page === pagination.page
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-black text-black hover:bg-blue-100'
                          }
                        `}
                      >
                        {page}
                      </Button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminComments;
