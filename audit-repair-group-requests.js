// Comprehensive audit and repair script for Group Mentor Admin Assignment Requests
const fs = require('fs');
const path = require('path');

console.log('🔍 AUDIT & REPAIR GROUP MENTOR REQUESTS');
console.log('=====================================\n');

const auditRepairScript = `
const mongoose = require('mongoose');

async function auditAndRepairGroupRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));

    console.log('\\n🔍 STEP 1: AUDIT ALL GROUP REQUESTS');
    
    const allGroupRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group'
    }).lean();

    console.log(\`Total group requests found: \${allGroupRequests.length}\`);

    let validRequests = [];
    let invalidRequests = [];
    let repairableRequests = [];

    for (const request of allGroupRequests) {
      const analysis = {
        id: request._id,
        projectTitle: request.projectTitle,
        hasGroupId: !!request.groupId,
        groupId: request.groupId,
        hasGroupSnapshot: !!request.groupSnapshot,
        issues: []
      };

      // Check if groupId exists
      if (!request.groupId) {
        analysis.issues.push('Missing groupId');
      } else {
        // Check if groupId points to valid group
        const group = await Group.findById(request.groupId).lean();
        if (!group) {
          analysis.issues.push('GroupId points to non-existent group');
        } else {
          analysis.groupName = group.name;
          analysis.memberCount = group.studentIds?.length || 0;
        }
      }

      // Check if we can recover from project
      if (request.projectId) {
        const project = await Project.findById(request.projectId).lean();
        if (project) {
          analysis.hasProjectGroupId = !!project.groupId;
          analysis.projectGroupId = project.groupId;
          analysis.projectRegistrationType = project.registrationType;
          
          if (project.groupId && !request.groupId) {
            analysis.issues.push('Can recover groupId from project');
            repairableRequests.push(analysis);
          }
        } else {
          analysis.issues.push('Project not found');
        }
      }

      if (analysis.issues.length === 0) {
        validRequests.push(analysis);
      } else {
        invalidRequests.push(analysis);
      }
    }

    console.log(\`\\n📊 AUDIT RESULTS:\`);
    console.log(\`   ✅ Valid requests: \${validRequests.length}\`);
    console.log(\`   ❌ Invalid requests: \${invalidRequests.length}\`);
    console.log(\`   🔧 Repairable requests: \${repairableRequests.length}\`);

    // Display invalid requests
    if (invalidRequests.length > 0) {
      console.log('\\n❌ INVALID REQUESTS:');
      invalidRequests.forEach((req, index) => {
        console.log(\`   \${index + 1}. \${req.projectTitle}\`);
        req.issues.forEach(issue => console.log(\`      - \${issue}\`));
      });
    }

    console.log('\\n🔧 STEP 2: REPAIR BROKEN REQUESTS');
    
    let repairedCount = 0;
    let failedRepairs = 0;

    for (const repairable of repairableRequests) {
      console.log(\`\\n🔧 Repairing: \${repairable.projectTitle}\`);
      
      try {
        // Get the project to recover groupId
        const project = await Project.findById(repairable.id).lean();
        if (!project || !project.groupId) {
          console.log(\`   ❌ Cannot recover - project or groupId missing\`);
          failedRepairs++;
          continue;
        }

        // Verify the group exists
        const group = await Group.findById(project.groupId).lean();
        if (!group) {
          console.log(\`   ❌ Cannot recover - group document missing\`);
          failedRepairs++;
          continue;
        }

        // Update the request with the correct groupId
        await AdminAssignmentRequest.updateOne(
          { _id: repairable.id },
          { groupId: project.groupId.toString() }
        );

        console.log(\`   ✅ Repaired - groupId set to: \${project.groupId}\`);
        console.log(\`   📋 Group: \${group.name} (\${group.studentIds?.length || 0} members)\`);
        repairedCount++;

      } catch (repairError) {
        console.log(\`   ❌ Repair failed: \${repairError.message}\`);
        failedRepairs++;
      }
    }

    console.log('\\n🔍 STEP 3: CREATE MISSING GROUPS FOR UNREPAIRABLE REQUESTS');
    
    const unrepairedRequests = invalidRequests.filter(req => 
      !repairableRequests.find(r => r.id === req.id)
    );

    for (const request of unrepairedRequests) {
      if (request.projectId) {
        console.log(\`\\n🏢 Creating group for: \${request.projectTitle}\`);
        
        try {
          const project = await Project.findById(request.projectId).lean();
          if (!project) {
            console.log(\`   ❌ Project not found\`);
            continue;
          }

          // Create group from project data
          let studentIds = [];
          let groupName = \`Group for \${project.title}\`;

          if (project.group && project.group.members) {
            studentIds = project.group.members
              .filter(member => member.userId)
              .map(member => member.userId);
            groupName = project.group.name || groupName;
          } else if (project.members && Array.isArray(project.members)) {
            studentIds = project.members.filter(id => id).map(id => id.toString());
          }

          // Include project author
          if (project.authorId && !studentIds.includes(project.authorId.toString())) {
            studentIds.push(project.authorId.toString());
          }

          const newGroup = new Group({
            name: groupName,
            description: \`Group for project: \${project.title}\`,
            studentIds: studentIds,
            isActive: true
          });

          await newGroup.save();
          
          // Update project with new groupId
          await Project.updateOne(
            { _id: project._id },
            { groupId: newGroup._id.toString() }
          );

          // Update request with new groupId
          await AdminAssignmentRequest.updateOne(
            { _id: request.id },
            { groupId: newGroup._id.toString() }
          );

          console.log(\`   ✅ Created group: \${newGroup.name}\`);
          console.log(\`   📋 Members: \${studentIds.length}\`);
          repairedCount++;

        } catch (createError) {
          console.log(\`   ❌ Group creation failed: \${createError.message}\`);
          failedRepairs++;
        }
      }
    }

    console.log('\\n🔍 STEP 4: FINAL VALIDATION');
    
    const finalGroupRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group'
    }).lean();

    const finalValid = [];
    const finalInvalid = [];

    for (const request of finalGroupRequests) {
      if (request.groupId) {
        const group = await Group.findById(request.groupId).lean();
        if (group) {
          finalValid.push(request);
        } else {
          finalInvalid.push(request);
        }
      } else {
        finalInvalid.push(request);
      }
    }

    console.log(\`\\n📊 FINAL RESULTS:\`);
    console.log(\`   ✅ Valid requests: \${finalValid.length}\`);
    console.log(\`   ❌ Invalid requests: \${finalInvalid.length}\`);
    console.log(\`   🔧 Repaired: \${repairedCount}\`);
    console.log(\`   ❌ Failed repairs: \${failedRepairs}\`);

    if (finalInvalid.length === 0) {
      console.log('\\n🎉 ALL GROUP REQUESTS ARE NOW VALID!');
    } else {
      console.log(\`\\n⚠️ \${finalInvalid.length} requests still need manual attention\`);
    }

    await mongoose.disconnect();
    console.log('\\n🎯 AUDIT & REPAIR COMPLETED');

  } catch (error) {
    console.error('❌ Audit script error:', error);
    process.exit(1);
  }
}

auditAndRepairGroupRequests();
`;

// Write the audit script to a file
fs.writeFileSync(path.join(__dirname, 'execute-audit-repair.js'), auditRepairScript);

console.log('✅ Audit & Repair script created: execute-audit-repair.js');
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Run: node execute-audit-repair.js');
console.log('2. This will audit all group requests and repair broken ones');
console.log('3. Check the console output for detailed results');
console.log('\n🔍 WHAT THE SCRIPT DOES:');
console.log('- Audits all Group Mentor Admin Assignment Requests');
console.log('- Identifies missing or invalid groupId references');
console.log('- Repairs requests by recovering groupId from Project documents');
console.log('- Creates missing Group documents when needed');
console.log('- Updates both Project and AdminAssignmentRequest records');
console.log('- Provides detailed audit logs and repair statistics');
console.log('- Validates all repairs and reports final status');
