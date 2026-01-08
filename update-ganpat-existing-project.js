const mongoose = require('mongoose');

async function updateGanpatExistingProject() {
  try {
    console.log('🔄 Updating Ganpat Existing Project\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Step 1: Get ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat user:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    // Step 2: Find any project with ganpat as author (using different search)
    console.log('\n🔍 Step 2: Finding any project by ganpat');
    
    // Try multiple search patterns
    let ganpatProject = null;
    
    // Search 1: Exact name match
    ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    
    // Search 2: Case-insensitive
    if (!ganpatProject) {
      ganpatProject = await projectsCollection.findOne({ 
        'author.name': { $regex: 'ganpat', $options: 'i' }
      });
    }
    
    // Search 3: Any project that mentions ganpat
    if (!ganpatProject) {
      ganpatProject = await projectsCollection.findOne({ 
        $or: [
          { 'author.name': { $regex: 'ganpat', $options: 'i' } },
          { title: { $regex: 'ganpat', $options: 'i' } },
          { description: { $regex: 'ganpat', $options: 'i' } }
        ]
      });
    }
    
    if (ganpatProject) {
      console.log('✅ Found project:');
      console.log(`   Title: ${ganpatProject.title}`);
      console.log(`   Author ID: ${ganpatProject.author?.id}`);
      console.log(`   Author Name: ${ganpatProject.author?.name}`);
      
      // Update the project
      console.log('\n🔄 Step 3: Updating project with user data');
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
      
      console.log('✅ Project updated!');
      
    } else {
      console.log('❌ No project found in database');
      console.log('🔧 Creating project that matches API data...');
      
      // Create project that matches the API structure
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
          id: ganpatUser._id.toString(),
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
      console.log('✅ Project created!');
      console.log(`   Project ID: ${result.insertedId}`);
      console.log(`   Author ID: ${ganpatUser._id.toString()}`);
    }
    
    // Step 4: Test with the API author ID to see if we can find/update that project
    console.log('\n🔍 Step 4: Checking API author ID');
    const apiAuthorId = '693becc696e13382a825371'; // From API response
    
    const projectWithApiId = await projectsCollection.findOne({ 'author.id': apiAuthorId });
    if (projectWithApiId) {
      console.log('✅ Found project with API author ID');
      console.log(`   Project: ${projectWithApiId.title}`);
      
      // Update this project with correct user ID
      await projectsCollection.updateOne(
        { _id: projectWithApiId._id },
        { 
          $set: { 
            'author.id': ganpatUser._id.toString(),
            'author.image': ganpatUser.photo || '/placeholder-user.jpg'
          }
        }
      );
      
      console.log('✅ Updated API project with correct user ID!');
    } else {
      console.log('❌ No project found with API author ID');
    }
    
    console.log('\n🎉 UPDATE COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Found/created ganpat project in database');
    console.log('✅ Linked project to ganpat user ID');
    console.log('✅ Set author image from user profile');
    console.log('✅ Project should now appear in ganpat profile');
    
    console.log('\n🔑 LOGIN INFO:');
    console.log('   Email: ganpat@example.com');
    console.log('   Password: (use existing password)');
    
    console.log('\n🌐 TEST IT:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log('2. Login with ganpat credentials');
    console.log('3. Check profile: http://localhost:3000/profile');
    console.log('4. Project should appear with profile photo');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateGanpatExistingProject();
