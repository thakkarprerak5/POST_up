import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import User from '@/models/User';
import Project from '@/models/Project';
import Group from '@/models/Group';

// GET /api/admin/assignment-requests - Fetch all admin assignment requests
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        console.log('🔍 Fetching admin assignment requests...');
        
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // pending, assigned, cancelled
        const type = searchParams.get('type'); // student, group
        const search = searchParams.get('search'); // search by project title or student name

        console.log('📊 Query parameters:', { status, type, search });

        // Build query
        const query: any = {};

        if (status) {
            query.status = status;
            console.log('🔍 Filtering by status:', status);
        }

        if (type) {
            query.requestedToType = type;
            console.log('🔍 Filtering by type:', type);
        }

        console.log('🔍 Final query:', query);

        // Fetch requests with populated fields
        let requests = await AdminAssignmentRequest.find(query)
            .populate('requestedBy', 'fullName email photo')
            .populate('studentId', 'fullName email photo')
            .populate('groupId', 'name description studentIds')
            .populate('assignedMentorId', 'fullName email photo expertise')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        console.log('📊 Found requests before filtering:', requests.length);

        // Debug: Log groupSnapshot data for each request
        const groupRequestsWithSnapshots = [];
        for (let index = 0; index < requests.length; index++) {
            const req = requests[index];
            if (req.requestedToType === 'group') {
                console.log(`🔍 Request ${index + 1} (${req.projectTitle}):`, {
                    id: req._id,
                    requestedToType: req.requestedToType,
                    hasGroupSnapshot: !!req.groupSnapshot,
                    groupSnapshot: req.groupSnapshot,
                    groupId: req.groupId,
                    hasRequestedBy: !!req.requestedBy
                });

                // If no groupSnapshot but has requestedBy, create fallback data
                if (!req.groupSnapshot && req.requestedBy) {
                    // For now, just create basic group snapshot without members
                    // TODO: Add member fetching once basic functionality is working
                    req.groupSnapshot = {
                        lead: {
                            id: req.requestedBy._id,
                            name: req.requestedBy.fullName,
                            email: req.requestedBy.email
                        },
                        members: [] // Temporarily empty until we fix the async issue
                    };
                    console.log(`🔧 Created basic fallback groupSnapshot for request ${index + 1}`);
                }
            }
            groupRequestsWithSnapshots.push(req);
        }

        // Replace original requests with enhanced ones
        requests = groupRequestsWithSnapshots;

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            const originalLength = requests.length;
            requests = requests.filter((req: any) => {
                const projectTitle = req.projectTitle?.toLowerCase() || '';
                const studentName = req.requestedBy?.fullName?.toLowerCase() || '';
                const studentEmail = req.requestedBy?.email?.toLowerCase() || '';

                return projectTitle.includes(searchLower) ||
                    studentName.includes(searchLower) ||
                    studentEmail.includes(searchLower);
            });
            console.log('🔍 Search filter applied:', { search, originalLength, filteredLength: requests.length });
        }

        console.log('📊 Final requests count:', requests.length);

        // Filter out removed requests for statistics
        const activeRequests = requests.filter((r: any) => r.status !== 'removed');
        console.log('📊 Active requests (excluding removed):', activeRequests.length);

        // Get statistics excluding removed requests
        const stats = {
            total: activeRequests.length,
            pending: activeRequests.filter((r: any) => r.status === 'pending').length,
            assigned: activeRequests.filter((r: any) => r.status === 'assigned').length,
            cancelled: activeRequests.filter((r: any) => r.status === 'cancelled').length,
            individual: activeRequests.filter((r: any) => r.requestedToType === 'student').length,
            group: activeRequests.filter((r: any) => r.requestedToType === 'group').length,
            removed: requests.filter((r: any) => r.status === 'removed').length, // NEW: Track removed count
        };

        console.log('📊 Stats:', stats);
        console.log(`✅ Fetched ${requests.length} admin assignment requests (${activeRequests.length} active)`);

        return NextResponse.json({
            requests,
            stats,
            total: requests.length
        });

    } catch (error: any) {
        console.error('❌ Error fetching admin assignment requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignment requests', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/admin/assignment-requests - Create new assignment request
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { 
            projectId, 
            requestedToType, 
            requestType, // NEW: Request type
            studentId, 
            groupId,
            groupSnapshot 
        } = body;

        // Validate required fields
        if (!projectId || !requestedToType || !requestType) {
            return NextResponse.json({ 
                error: 'Missing required fields: projectId, requestedToType, requestType' 
            }, { status: 400 });
        }

        // Validate requestType
        if (!['INDIVIDUAL', 'GROUP'].includes(requestType)) {
            return NextResponse.json({ 
                error: 'Invalid requestType. Must be INDIVIDUAL or GROUP' 
            }, { status: 400 });
        }

        // Get project details
        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create assignment request with NEW requestType field
        const requestData = {
            projectId,
            projectTitle: project.title,
            projectDescription: project.description,
            proposalFile: project.proposalFile,
            requestedBy: currentUser._id.toString(),
            requestedToType,
            requestType, // NEW: Include requestType
            studentId: requestedToType === 'student' ? (studentId || currentUser._id.toString()) : undefined,
            groupId: requestedToType === 'group' ? groupId : undefined,
            groupSnapshot
        };

        const result = await AdminAssignmentRequest.createAdminAssignmentRequest(requestData);

        console.log('✅ Assignment request created:', result);

        return NextResponse.json({
            success: true,
            request: result,
            message: 'Assignment request created successfully'
        });

    } catch (error: any) {
        console.error('❌ Error creating assignment request:', error);
        return NextResponse.json(
            { error: 'Failed to create assignment request', details: error.message },
            { status: 500 }
        );
    }
}
