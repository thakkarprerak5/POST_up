// Direct database fix for missing authorIds
const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');

async function fixAuthorAssociations() {
  try {
    await mongoose.connect('mongodb://localhost:27017/post-up');
    console.log('Connected to database');
    
    // Get all projects without authorId
    const projectsWithoutAuthor = await Project.find({
      $or: [
        { authorId: { $exists: false } },
        { authorId: { $eq: '' } },
        { authorId: { $eq: null } }
      ]
    });
    
    console.log(`Found ${projectsWithoutAuthor.length} projects without authorId`);
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    // Try to match projects with users
    for (const project of projectsWithoutAuthor) {
      console.log(`\nProcessing project: ${project.title}`);
      
      let matchedUser = null;
      
      // Try different matching strategies
      const projectTitle = (project.title || '').toLowerCase();
      const projectDesc = (project.description || '').toLowerCase();
      
      // Strategy 1: Try to match by exact name
      for (const user of users) {
        const userName = (user.fullName || user.name || '').toLowerCase();
        if (projectTitle.includes(userName) || projectDesc.includes(userName)) {
          matchedUser = user;
          console.log(`  ✅ Matched by name: ${user.fullName || user.name}`);
          break;
        }
      }
      
      // Strategy 2: Try to match by email
      if (!matchedUser) {
        for (const user of users) {
          const userEmail = (user.email || '').toLowerCase();
          if (projectTitle.includes(userEmail) || projectDesc.includes(userEmail)) {
            matchedUser = user;
            console.log(`  ✅ Matched by email: ${user.email}`);
            break;
          }
        }
      }
      
      // Strategy 3: Try to match by username
      if (!matchedUser) {
        for (const user of users) {
          const username = (user.username || '').toLowerCase();
          if (projectTitle.includes(username) || projectDesc.includes(username)) {
            matchedUser = user;
            console.log(`  ✅ Matched by username: ${user.username}`);
            break;
          }
        }
      }
      
      if (matchedUser) {
        console.log(`  📝 Updating project ${project._id} with authorId: ${matchedUser._id}`);
        
        // Update the project
        const updateResult = await Project.updateOne(
          { _id: project._id },
          { $set: { authorId: matchedUser._id } }
        );
        
        console.log(`  ✅ Updated successfully: ${updateResult.modifiedCount} document(s)`);
      } else {
        console.log(`  ❌ No match found for project: ${project.title}`);
      }
    }
    
    console.log('\n✅ Author association fix complete!');
    
    // Test the result
    const updatedProjects = await Project.find({
      $or: [
        { authorId: { $exists: false } },
        { authorId: { $eq: '' } },
        { authorId: { $eq: null } }
      ]
    });
    
    console.log(`\nRemaining projects without authorId: ${updatedProjects.length}`);
    
    // Test trending API
    const trendingResponse = await fetch('http://localhost:3000/api/feed/trending?limit=3');
    const trendingData = await trendingResponse.json();
    
    if (trendingData.success && trendingData.projects.length > 0) {
      console.log('\n✅ Updated trending feed:');
      trendingData.projects.forEach((project, index) => {
        console.log(`  Project ${index + 1}:`, {
          title: project.title,
          authorId: project.authorId,
          authorName: project.author?.name,
          hasAuthorId: !!(project.authorId === ''),
          hasAuthorData: project.author?.name !== 'Unknown Author'
        });
      });
    }
    
  } catch (error) {
    console.error('Error fixing author associations:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixAuthorAssociations();
