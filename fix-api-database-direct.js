const mongoose = require('mongoose');

async function fixApiDatabaseDirect() {
  try {
    console.log('🔧 Fixing API Database Direct Connection\n');
    
    // Use the same connection as the API
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    console.log('✅ Connected to database');
    
    // Find ganpat user first
    const usersCollection = db.collection('users');
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat User:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Email: ${ganpatUser.email}`);
    
    // Find all projects with ganpat as author
    console.log('\n🔍 Finding all ganpat projects...');
    const ganpatProjects = await projectsCollection.find({
      'author.name': { $regex: 'ganpat', $options: 'i' }
    }).toArray();
    
    console.log(`✅ Found ${ganpatProjects.length} projects:`);
    ganpatProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title}`);
      console.log(`      Current author.id: ${project.author?.id}`);
      console.log(`      Current author.name: ${project.author?.name}`);
    });
    
    if (ganpatProjects.length > 0) {
      // Update all ganpat projects with correct user ID
      console.log('\n🔄 Updating projects with correct user ID...');
      
      for (const project of ganpatProjects) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { 
            $set: { 
              'author.id': ganpatUser._id.toString(),
              'author.name': ganpatUser.fullName,
              'author.image': ganpatUser.photo || '/placeholder-user.jpg'
            }
          }
        );
        
        console.log(`✅ Updated: ${project.title}`);
        console.log(`   New author.id: ${ganpatUser._id.toString()}`);
      }
      
      console.log('\n✅ All projects updated!');
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const updatedProjects = await projectsCollection.find({
        'author.id': ganpatUser._id.toString()
      }).toArray();
      
      console.log(`✅ Found ${updatedProjects.length} projects with correct user ID:`);
      updatedProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title}`);
      });
      
    } else {
      console.log('❌ No ganpat projects found');
    }
    
    console.log('\n🎉 FIX COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Connected to API database');
    console.log('✅ Found ganpat user and projects');
    console.log('✅ Updated all projects with correct user ID');
    console.log('✅ Set author image from user profile');
    
    console.log('\n🌐 NOW TEST IT:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log('2. Login with ganpat@example.com');
    console.log('3. Check profile: http://localhost:3000/profile');
    console.log('4. Project should now appear!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixApiDatabaseDirect();
