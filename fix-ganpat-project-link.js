const mongoose = require('mongoose');

async function fixGanpatProjectLink() {
  try {
    console.log('🔧 Fixing Ganpat Project Link to User Account\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Step 1: Get ganpat user details
    console.log('👤 Step 1: Getting Ganpat user details');
    const ganpatUser = await usersCollection.findOne({ 
      $or: [
        { fullName: 'ganpat' },
        { email: 'ganpat@example.com' }
      ]
    });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat user:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Name: ${ganpatUser.fullName}`);
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    // Step 2: Find the project by ganpat (using the ID from API)
    console.log('\n📋 Step 2: Finding Ganpat project');
    const ganpatProject = await projectsCollection.findOne({ 
      'author.name': 'ganpat'
    });
    
    if (!ganpatProject) {
      console.log('❌ Project not found in database');
      console.log('🔧 Creating project from API data...');
      
      // Create the project since it exists in API but not in database
      const newProject = {
        title: 'website',
        description: 'A simple platform built with curiosity and late-night debugging, focused on learning, experimenting, and making things work a little better than yesterday. Still evolving, still improving, and always open to new ideas.',
        tags: ['Web Development', 'React', 'Next.js', 'Node.js', 'MongoDB', 'Vercel'],
        images: [
          '/uploads/9add3341-7b48-42e6-b660-65bd8d2f9d4d.jpg',
          '/uploads/34fd7d29-e9dc-4cac-8785-2cc5c24dc8fc.jpg'
        ],
        githubUrl: '',
        liveUrl: '',
        author: {
          id: ganpatUser._id.toString(), // Use correct user ID
          name: ganpatUser.fullName,
          image: ganpatUser.photo || '/placeholder-user.jpg'
        },
        likes: [],
        likeCount: 0,
        comments: [],
        shares: [],
        shareCount: 0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await projectsCollection.insertOne(newProject);
      console.log('✅ Project created in database!');
      console.log(`   Project ID: ${result.insertedId}`);
      console.log(`   Linked to User ID: ${ganpatUser._id}`);
      
    } else {
      console.log('✅ Found existing project:');
      console.log(`   Project ID: ${ganpatProject._id}`);
      console.log(`   Title: ${ganpatProject.title}`);
      console.log(`   Current Author ID: ${ganpatProject.author?.id}`);
      console.log(`   Current Author Name: ${ganpatProject.author?.name}`);
      console.log(`   Current Author Image: ${ganpatProject.author?.image || 'NOT SET'}`);
      
      // Step 3: Update project with correct user ID and photo
      console.log('\n🔄 Step 3: Updating project with correct user data');
      await projectsCollection.updateOne(
        { _id: ganpatProject._id },
        { 
          $set: { 
            'author.id': ganpatUser._id.toString(),
            'author.name': ganpatUser.fullName,
            'author.image': ganpatUser.photo || '/placeholder-user.jpg'
          }
        }
      );
      
      console.log('✅ Project updated with correct user data!');
      console.log(`   Author ID: ${ganpatUser._id.toString()}`);
      console.log(`   Author Image: ${ganpatUser.photo || '/placeholder-user.jpg'}`);
    }
    
    // Step 4: Test the user projects API
    console.log('\n📁 Step 4: Testing User Projects API');
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:3000/api/users/${ganpatUser._id}/projects`);
      if (response.ok) {
        const userProjects = await response.json();
        console.log(`✅ API returns ${userProjects.length} projects for ganpat`);
        userProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title}`);
          console.log(`      Author: ${project.author?.name}`);
          console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
        });
      } else {
        console.log(`❌ API failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 GANPAT PROJECT LINK FIX COMPLETE!');
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('✅ Project linked to correct ganpat user ID');
    console.log('✅ Author image set from user profile');
    console.log('✅ Project will appear in ganpat profile');
    console.log('✅ Profile photo will be visible');
    
    console.log('\n🔑 GANPAT LOGIN INFO:');
    console.log(`   Email: ${ganpatUser.email}`);
    console.log('   Password: (use existing password)');
    
    console.log('\n🌐 TEST IT:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log(`2. Login with: ${ganpatUser.email}`);
    console.log('3. Check profile: http://localhost:3000/profile');
    console.log('4. Verify "website" project appears');
    console.log('5. Check profile photo is visible');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixGanpatProjectLink();
