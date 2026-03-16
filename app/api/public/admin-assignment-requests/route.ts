// app/api/public/admin-assignment-requests/route.ts - Public API for testing
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
// Import models
import User from '@/models/User';
import Group from '@/models/Group';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';

// GET /api/public/admin-assignment-requests - Get all admin assignment requests (no auth required)
export async function GET() {
  try {
    console.log('🔍 Public Admin Assignment Requests API called');
    
    await connectDB();

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database connection state:', mongoose.connection.readyState);
      throw new Error(`Database not connected. State: ${mongoose.connection.readyState}`);
    }

    console.log('✅ Database connected, checking collections...');
    
    // Check if the collection exists
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Try to access the adminassignmentrequests collection directly
    const collectionExists = collections.some(c => c.name === 'adminassignmentrequests');
    console.log('adminassignmentrequests collection exists:', collectionExists);

    if (!collectionExists) {
      console.log('Collection does not exist, returning empty result');
      return NextResponse.json({ 
        requests: [],
        total: 0,
        stats: {
          pending: 0,
          assigned: 0,
          cancelled: 0
        }
      });
    }

    console.log('✅ Model imported, fetching requests...');

    try {
      // Get all admin assignment requests with population
      const requests = await AdminAssignmentRequest.find({})
        .populate('requestedBy', 'fullName email photo')
        .populate('studentId', 'fullName email photo')
        .populate('groupId', 'name description')
        .populate('projectId', 'title description proposalFile createdAt tags')
        .populate('assignedMentorId', 'fullName email photo')
        .populate('assignedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      console.log(`✅ Found ${requests.length} admin assignment requests`);
      if (requests.length > 0) {
        console.log('Sample request data:', JSON.stringify(requests[0], null, 2));
      }

      // Add groupSnapshot for group requests if missing
      const enhancedRequests = requests.map((request: any) => {
        if (request.requestedToType === 'group' && !request.groupSnapshot) {
          console.log('🔧 Adding missing groupSnapshot for request:', request._id);
          
          // Create a basic groupSnapshot from available data
          if (request.requestedBy) {
            return {
              ...request,
              groupSnapshot: {
                lead: {
                  id: request.requestedBy._id || '',
                  name: request.requestedBy.fullName || '',
                  email: request.requestedBy.email || ''
                },
                members: [{
                  id: request.requestedBy._id || '',
                  name: request.requestedBy.fullName || '',
                  email: request.requestedBy.email || '',
                  status: 'active'
                }]
              }
            };
          } else {
            // Fallback empty groupSnapshot
            return {
              ...request,
              groupSnapshot: {
                lead: {
                  id: '',
                  name: '',
                  email: ''
                },
                members: []
              }
            };
          }
        }
        return request;
      });

      return NextResponse.json({ 
        requests: enhancedRequests || [],
        total: enhancedRequests?.length || 0,
        stats: {
          pending: enhancedRequests?.filter(r => r.status === 'pending').length || 0,
          assigned: enhancedRequests?.filter(r => r.status === 'assigned').length || 0,
          cancelled: enhancedRequests?.filter(r => r.status === 'cancelled').length || 0
        }
      });
    } catch (populateError: any) {
      console.error('❌ Population error:', populateError);
      console.log('⚠️ Falling back to manual population...');
      
      // Fallback to manual population
      const requests = await AdminAssignmentRequest.find({})
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // Manually populate user data
      const User = mongoose.model('User');
      const populatedRequests = await Promise.all(
        requests.map(async (request: any) => {
          try {
            // Clone the request to avoid modifying the original
            const populatedRequest = { ...request };
            
            // Populate user references
            if (populatedRequest.requestedBy) {
              const user = await User.findById(populatedRequest.requestedBy).select('fullName email photo').lean();
              populatedRequest.requestedBy = user;
            }
            
            if (populatedRequest.studentId) {
              const studentUser = await User.findById(populatedRequest.studentId).select('fullName email photo').lean();
              populatedRequest.studentId = studentUser;
            }
            
            if (populatedRequest.assignedMentorId) {
              const mentorUser = await User.findById(populatedRequest.assignedMentorId).select('fullName email photo').lean();
              populatedRequest.assignedMentorId = mentorUser;
            }
            
            if (populatedRequest.assignedBy) {
              const assignedByUser = await User.findById(populatedRequest.assignedBy).select('fullName email').lean();
              populatedRequest.assignedBy = assignedByUser;
            }
            
            // Populate project data if it's an ObjectId
            if (populatedRequest.projectId && typeof populatedRequest.projectId === 'object') {
              // Project is already populated
            } else if (populatedRequest.projectId) {
              const project = await mongoose.model('Project').findById(populatedRequest.projectId).lean();
              populatedRequest.projectId = project;
            }
            
            // Add groupSnapshot from project data for group requests if missing
            if (populatedRequest.requestedToType === 'group' && !populatedRequest.groupSnapshot) {
              console.log('🔧 Adding missing groupSnapshot for request:', populatedRequest._id);
              
              // Create a basic groupSnapshot from available data
              if (populatedRequest.requestedBy) {
                populatedRequest.groupSnapshot = {
                  lead: {
                    id: populatedRequest.requestedBy._id || '',
                    name: populatedRequest.requestedBy.fullName || '',
                    email: populatedRequest.requestedBy.email || ''
                  },
                  members: [{
                    id: populatedRequest.requestedBy._id || '',
                    name: populatedRequest.requestedBy.fullName || '',
                    email: populatedRequest.requestedBy.email || '',
                    status: 'active'
                  }]
                };
                console.log('🔧 Created basic groupSnapshot from requester data');
              } else {
                // Fallback empty groupSnapshot
                populatedRequest.groupSnapshot = {
                  lead: {
                    id: '',
                    name: '',
                    email: ''
                  },
                  members: []
                };
                console.log('🔧 Created empty groupSnapshot as fallback');
              }
            }
            
            return populatedRequest;
          } catch (userError) {
            console.error('❌ Error populating user for request:', request._id, userError);
            return request;
          }
        })
      );

      return NextResponse.json({ 
        requests: populatedRequests || [],
        total: populatedRequests?.length || 0,
        stats: {
          pending: populatedRequests?.filter(r => r.status === 'pending').length || 0,
          assigned: populatedRequests?.filter(r => r.status === 'assigned').length || 0,
          cancelled: populatedRequests?.filter(r => r.status === 'cancelled').length || 0
        },
        fallback: true,
        message: 'Auto population failed, used manual population'
      });
    }
  } catch (error: any) {
    console.error('❌ Error fetching admin assignment requests:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to fetch admin assignment requests', 
      details: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
