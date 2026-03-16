'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  FileText, 
  User, 
  MessageSquare, 
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Report {
  _id: string;
  reason: string;
  description: string;
  targetType: 'project' | 'user' | 'comment' | 'post';
  targetId: string;
  targetTitle: string;
  reporterId: string;
  reporterName: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Mock data for demonstration
    const mockReports: Report[] = [
      {
        _id: '1',
        reason: 'Inappropriate content',
        description: 'The project contains offensive language and inappropriate images.',
        targetType: 'project',
        targetId: 'proj1',
        targetTitle: 'Sample Project 1',
        reporterId: 'user1',
        reporterName: 'John Doe',
        status: 'pending',
        createdAt: '2026-01-27T10:30:00Z',
        updatedAt: '2026-01-27T10:30:00Z'
      },
      {
        _id: '2',
        reason: 'Spam',
        description: 'User is posting spam content repeatedly.',
        targetType: 'user',
        targetId: 'user2',
        targetTitle: 'Spam User',
        reporterId: 'user3',
        reporterName: 'Jane Smith',
        status: 'resolved',
        createdAt: '2026-01-27T09:15:00Z',
        updatedAt: '2026-01-27T11:20:00Z'
      },
      {
        _id: '3',
        reason: 'Harassment',
        description: 'User is harassing other users in comments.',
        targetType: 'comment',
        targetId: 'comment1',
        targetTitle: 'Harassing Comment',
        reporterId: 'user4',
        reporterName: 'Bob Wilson',
        status: 'pending',
        createdAt: '2026-01-27T08:45:00Z',
        updatedAt: '2026-01-27T08:45:00Z'
      },
      {
        _id: '4',
        reason: 'Copyright violation',
        description: 'Content appears to be copied from another source without attribution.',
        targetType: 'project',
        targetId: 'proj2',
        targetTitle: 'Copied Project',
        reporterId: 'user5',
        reporterName: 'Alice Brown',
        status: 'dismissed',
        createdAt: '2026-01-26T15:30:00Z',
        updatedAt: '2026-01-26T16:45:00Z'
      }
    ];

    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'dismissed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <FileText className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'post': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.targetTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.targetType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleResolve = (reportId: string) => {
    setReports(reports.map(report => 
      report._id === reportId 
        ? { ...report, status: 'resolved' as const, updatedAt: new Date().toISOString() }
        : report
    ));
  };

  const handleDismiss = (reportId: string) => {
    setReports(reports.map(report => 
      report._id === reportId 
        ? { ...report, status: 'dismissed' as const, updatedAt: new Date().toISOString() }
        : report
    ));
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
        <p className="text-gray-600">Review and manage user reports and content moderation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <p className="text-xs text-gray-500">Need review</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
            <p className="text-xs text-gray-500">Handled</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dismissed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.dismissed}</div>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reports found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge className={getStatusColor(report.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(report.status)}
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800">
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(report.targetType)}
                          <span className="capitalize">{report.targetType}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.reason}</h3>
                    <p className="text-gray-600 mb-4">{report.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>{report.targetTitle}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Reported by {report.reporterName}</span>
                      </div>
                      <div>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 ml-6">
                    {report.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(report._id)}
                          className="bg-green-500 text-white hover:bg-green-600 px-4 py-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(report._id)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </>
                    )}
                    {report.status !== 'pending' && (
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusIcon(report.status)}
                        <span className="ml-2 capitalize">{report.status}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
