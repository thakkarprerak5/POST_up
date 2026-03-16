// Fix existing admin assignment request with missing groupSnapshot
const mongoose = require('mongoose');

// Define AdminAssignmentRequest schema
const adminAssignmentRequestSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  proposalFile: { type: String, default: null },
  requestedBy: { type: String, ref: 'User', required: true },
  requestedToType: { type: String, enum: ['student', 'group'], required: true },
  studentId: { type: String, ref: 'User', default: null },
  groupId: { type: String, ref: 'Group', default: null },
  status: { type: String, enum: ['pending', 'assigned', 'cancelled', 'removed'], default: 'pending' },
  assignedMentorId: { type: String, ref: 'User', default: null },
  assignedBy: { type: String, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  groupSnapshot: {
    lead: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      email: { type: String, required: false }
    },
    members: [{
      id: { type: String },
      name: { type: String },
      email: { type: String, required: true },
      status: { type: String, enum: ['active', 'pending'], required: true }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Define Project schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  group: {
    lead: {
      id: { type: String },
      name: { type: String },
      email: { type: String }
    },
    members: [{
      id: { type: String },
      name: { type: String },
      email: { type: String },
      status: { type: String, enum: ['active', 'pending'] }
    }]
  }
});

async function fixGroupSnapshot() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    console.log('Connected to MongoDB');
    
    // Check all collections for admin assignment requests
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check multiple possible collection names
    const possibleCollections = ['adminassignmentrequests', 'adminassignmentrequest', 'assignmentrequests', 'admin_requests'];
    
    for (const collName of possibleCollections) {
      try {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        console.log(`Collection ${collName}: ${count} documents`);
        
        if (count > 0) {
          const docs = await collection.find({}).limit(3).toArray();
          console.log(`Sample documents from ${collName}:`);
          docs.forEach((doc, index) => {
            console.log(`  Doc ${index + 1}:`, {
              _id: doc._id,
              projectTitle: doc.projectTitle,
              requestedToType: doc.requestedToType,
              hasGroupSnapshot: !!doc.groupSnapshot
            });
          });
        }
      } catch (error) {
        console.log(`Error checking collection ${collName}:`, error.message);
      }
    }
    
    // Find all requests to see what's there
    const allRequests = await AdminAssignmentRequest.find({});
    console.log(`Found ${allRequests.length} total requests`);
    
    allRequests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`);
      console.log(`  ID: ${req._id}`);
      console.log(`  Title: ${req.projectTitle}`);
      console.log(`  Type: ${req.requestedToType}`);
      console.log(`  Has groupSnapshot: ${!!req.groupSnapshot}`);
      if (req.groupSnapshot) {
        console.log(`  groupSnapshot:`, JSON.stringify(req.groupSnapshot, null, 2));
      }
    });
    
    // Find the request with requestedToType: 'group' but missing groupSnapshot
    const request = await AdminAssignmentRequest.findOne({
      requestedToType: 'group'
    });
    
    console.log('Found group request:', request ? request._id : 'None');
    console.log('groupSnapshot exists:', request ? !!request.groupSnapshot : 'N/A');
    
    if (!request) {
      console.log('No group requests found');
      return;
    }
    
    if (request.groupSnapshot) {
      console.log('Request already has groupSnapshot');
      console.log('groupSnapshot:', JSON.stringify(request.groupSnapshot, null, 2));
      return;
    }
    
    console.log('Found request to fix:', request._id);
    
    // Get the project to extract group data
    const project = await Project.findById(request.projectId);
    if (!project) {
      console.log('Project not found for request');
      return;
    }
    
    console.log('Found project:', project.title);
    console.log('Project group data:', project.group);
    
    // Create groupSnapshot from project data
    const groupSnapshot = {
      lead: {
        id: project.group?.lead?.id || '',
        name: project.group?.lead?.name || '',
        email: project.group?.lead?.email || ''
      },
      members: project.group?.members || []
    };
    
    console.log('Created groupSnapshot:', groupSnapshot);
    
    // Update the request with groupSnapshot
    await AdminAssignmentRequest.findByIdAndUpdate(request._id, {
      groupSnapshot: groupSnapshot
    });
    
    console.log('✅ Fixed admin assignment request with groupSnapshot');
    
  } catch (error) {
    console.error('❌ Error fixing groupSnapshot:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixGroupSnapshot();
