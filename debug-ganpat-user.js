const mongoose = require('mongoose');

async function debugGanpatUser() {
  try {
    console.log('🔍 Debugging Ganpat User and Project\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Step 1: Find ganpat user
    console.log('👤 Step 1: Finding Ganpat User');
    const ganpatUser = await usersCollection.findOne({ fullName: /ganpat/i });
    
    if (ganpatUser) {
      console.log('✅ Found Ganpat User:');
      console.log(`   Name: ${ganpatUser.fullName}`);
      console.log(`   Email: ${ganpatUser.email}`);
      console.log(`   ID: ${ganpatUser._id}`);
      console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
      console.log(`   Active: ${ganpatUser.isActive ? '✅' : '❌'}`);
    } else {
      console.log('❌ Ganpat user not found in users collection');
      
      // Check all projects to see if any have ganpat as author
      console.log('\n🔍 Checking all projects for Ganpat as author...');
      const allProjects = await projectsCollection.find({}).toArray();
      const ganpatProjects = allProjects.filter(p => p.author?.name?.toLowerCase().includes('ganpat'));
      
      if (ganpatProjects.length > 0) {
        console.log(`✅ Found ${ganpatProjects.length} projects by Ganpat as author`);
        console.log('⚠️  But Ganpat user account does not exist in users collection!');
        console.log('💡 This explains why profile photo and user projects don\'t work');
        
        // Show the projects
        ganpatProjects.forEach((project, index) => {
          console.log(`\n   Project ${index + 1}: ${project.title}`);
          console.log(`      Author ID: ${project.author?.id}`);
          console.log(`      Author Name: ${project.author?.name}`);
          console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
        });
        
        // Create ganpat user account
        console.log('\n🔧 Creating Ganpat User Account...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const newGanpatUser = {
          fullName: 'ganpat',
          email: 'ganpat@example.com',
          password: hashedPassword,
          photo: '/placeholder-user.jpg',
          type: 'student',
          profile: {
            type: 'student',
            joinedDate: new Date(),
            bio: 'Project uploader',
            skills: ['Web Development'],
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
        
        const result = await usersCollection.insertOne(newGanpatUser);
        console.log('✅ Ganpat user account created!');
        console.log(`   Email: ganpat@example.com`);
        console.log(`   Password: password123`);
        console.log(`   User ID: ${result.insertedId}`);
        
        // Update projects to use the new user ID
        console.log('\n🔄 Updating Ganpat projects with new user ID...');
        const updateResult = await projectsCollection.updateMany(
          { 'author.name': /ganpat/i },
          { 
            $set: { 
              'author.id': result.insertedId.toString(),
              'author.image': '/placeholder-user.jpg'
            }
          }
        );
        console.log(`✅ Updated ${updateResult.modifiedCount} projects`);
        
      } else {
        console.log('❌ No projects found by Ganpat either');
        console.log('📊 Showing all project authors:');
        const uniqueAuthors = [...new Set(allProjects.map(p => p.author?.name).filter(Boolean))];
        uniqueAuthors.forEach((author, index) => {
          console.log(`   ${index + 1}. ${author}`);
        });
      }
    }
    
    // Step 2: Test user projects API
    const allProjects = await projectsCollection.find({}).toArray();
    const ganpatProjects = allProjects.filter(p => p.author?.name?.toLowerCase().includes('ganpat'));
    
    if (ganpatUser || ganpatProjects.length > 0) {
      console.log('\n📁 Step 2: Testing User Projects API');
      const userId = ganpatUser?._id || ganpatProjects[0]?.author?.id;
      
      if (userId) {
        try {
          const fetch = require('node-fetch');
          const response = await fetch(`http://localhost:3000/api/users/${userId}/projects`);
          if (response.ok) {
            const userProjects = await response.json();
            console.log(`✅ User projects API returned: ${userProjects.length} projects`);
          } else {
            console.log(`❌ User projects API failed: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ API test failed: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugGanpatUser();
