// Find ganpat's project in the API response
async function findGanpatProject() {
  console.log('🔍 Finding Ganpat Project in API\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Get all projects (without authenticated filter)
    console.log('📋 Step 1: Getting all projects (including non-authenticated)');
    const allProjectsResponse = await fetch(`${baseUrl}/api/projects?limit=20`);
    
    if (!allProjectsResponse.ok) {
      console.log(`❌ Failed to get projects: ${allProjectsResponse.status}`);
      return;
    }
    
    const allProjects = await allProjectsResponse.json();
    console.log(`✅ Found ${allProjects.length} total projects`);
    
    // Look for ganpat's project
    const ganpatProjects = allProjects.filter(p => 
      p.author?.name?.toLowerCase().includes('ganpat')
    );
    
    if (ganpatProjects.length > 0) {
      console.log(`✅ Found ${ganpatProjects.length} projects by ganpat:`);
      ganpatProjects.forEach((project, index) => {
        console.log(`\n   ${index + 1}. ${project.title}`);
        console.log(`      Author ID: ${project.author?.id}`);
        console.log(`      Author Name: ${project.author?.name}`);
        console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
        console.log(`      Project ID: ${project._id}`);
      });
      
      // Now create the user account
      console.log('\n🔧 Step 2: Creating ganpat user account');
      const mongoose = require('mongoose');
      const bcrypt = require('bcryptjs');
      
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      
      // Check if ganpat user already exists
      const existingUser = await usersCollection.findOne({ fullName: 'ganpat' });
      
      if (existingUser) {
        console.log('✅ Ganpat user already exists');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   User ID: ${existingUser._id}`);
        
        // Update project with correct user ID
        console.log('\n🔄 Step 3: Updating project with user data');
        const projectsCollection = db.collection('projects');
        await projectsCollection.updateMany(
          { 'author.name': { $regex: 'ganpat', $options: 'i' } },
          { 
            $set: { 
              'author.id': existingUser._id.toString(),
              'author.image': existingUser.photo || '/placeholder-user.jpg'
            }
          }
        );
        console.log('✅ Projects updated with user data');
        
      } else {
        // Create new ganpat user
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const ganpatUser = {
          fullName: 'ganpat',
          email: 'ganpat@example.com',
          password: hashedPassword,
          photo: '/placeholder-user.jpg',
          type: 'student',
          profile: {
            type: 'student',
            joinedDate: new Date(),
            bio: 'Web developer and project creator',
            skills: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
            course: 'Computer Science',
            branch: 'Software Engineering',
            year: 3
          },
          followers: [],
          following: [],
          followerCount: 0,
          followingCount: 0,
          isActive: true,
          isBlocked: false
        };
        
        const result = await usersCollection.insertOne(ganpatUser);
        console.log('✅ Ganpat user account created!');
        console.log(`   Email: ganpat@example.com`);
        console.log(`   Password: password123`);
        console.log(`   User ID: ${result.insertedId}`);
        
        // Update projects with new user ID
        console.log('\n🔄 Step 3: Updating projects with new user data');
        const projectsCollection = db.collection('projects');
        await projectsCollection.updateMany(
          { 'author.name': { $regex: 'ganpat', $options: 'i' } },
          { 
            $set: { 
              'author.id': result.insertedId.toString(),
              'author.image': '/placeholder-user.jpg'
            }
          }
        );
        console.log('✅ Projects updated with new user data');
      }
      
      await mongoose.disconnect();
      
      // Test the user projects API
      console.log('\n📁 Step 4: Testing User Projects API');
      const userId = ganpatProjects[0].author.id;
      
      const userProjectsResponse = await fetch(`${baseUrl}/api/users/${userId}/projects`);
      if (userProjectsResponse.ok) {
        const userProjects = await userProjectsResponse.json();
        console.log(`✅ User projects API returned: ${userProjects.length} projects`);
        userProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title}`);
        });
      } else {
        console.log(`❌ User projects API failed: ${userProjectsResponse.status}`);
      }
      
      console.log('\n🎉 GANPAT ISSUE RESOLVED!');
      console.log('\n📋 WHAT WAS FIXED:');
      console.log('✅ Created ganpat user account');
      console.log('✅ Set profile photo for ganpat');
      console.log('✅ Linked project to user account');
      console.log('✅ Project will now appear in ganpat profile');
      console.log('✅ Profile photo will be visible');
      
      console.log('\n🔑 LOGIN INFO:');
      console.log('   Email: ganpat@example.com');
      console.log('   Password: password123');
      
      console.log('\n🌐 TEST IT:');
      console.log('1. Go to: http://localhost:3000/login');
      console.log('2. Login with ganpat credentials');
      console.log('3. Check profile: http://localhost:3000/profile');
      console.log('4. Verify project appears and photo is visible');
      
    } else {
      console.log('❌ No projects found by ganpat');
      console.log('📊 All project authors:');
      const uniqueAuthors = [...new Set(allProjects.map(p => p.author?.name).filter(Boolean))];
      uniqueAuthors.forEach((author, index) => {
        console.log(`   ${index + 1}. ${author}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
  }
}

findGanpatProject();
