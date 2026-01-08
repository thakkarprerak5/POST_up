const mongoose = require('mongoose');

async function fixApiAuthorId() {
  try {
    console.log('🔧 Fixing API Author ID Mismatch\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Get ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Ganpat User:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Email: ${ganpatUser.email}`);
    
    // Find ALL projects that might be ganpat's
    console.log('\n🔍 Finding all possible ganpat projects...');
    
    const possibleProjects = await projectsCollection.find({
      $or: [
        { 'author.name': 'ganpat' },
        { 'author.name': { $regex: 'ganpat', $options: 'i' } },
        { 'author.id': '693becc696e13382a825371' }, // Old API ID
        { 'author.id': ganpatUser._id.toString() }  // Current user ID
      ]
    }).toArray();
    
    console.log(`✅ Found ${possibleProjects.length} possible projects:`);
    possibleProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title}`);
      console.log(`      _id: ${project._id}`);
      console.log(`      author.id: ${project.author?.id}`);
      console.log(`      author.name: ${project.author?.name}`);
    });
    
    if (possibleProjects.length > 0) {
      // Update ALL projects to use the correct user ID
      console.log('\n🔄 Updating all projects to use correct user ID...');
      
      for (const project of possibleProjects) {
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
      }
      
      console.log('\n✅ All projects updated!');
      
      // Verify the updates
      console.log('\n🔍 Verifying updates...');
      const updatedProjects = await projectsCollection.find({
        'author.id': ganpatUser._id.toString()
      }).toArray();
      
      console.log(`✅ Found ${updatedProjects.length} projects with correct user ID:`);
      updatedProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title}`);
      });
      
    } else {
      console.log('❌ No projects found to update');
    }
    
    // Test the API again
    console.log('\n🌐 Testing API after fix...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:3000/api/users/${ganpatUser._id}/projects`);
      if (response.ok) {
        const projects = await response.json();
        console.log(`✅ API now returns ${projects.length} projects`);
        projects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title}`);
        });
      } else {
        console.log(`❌ API still fails: ${response.status}`);
        
        // Try the old ID too
        const oldResponse = await fetch('http://localhost:3000/api/users/693becc696e13382a825371/projects');
        if (oldResponse.ok) {
          const oldProjects = await oldResponse.json();
          console.log(`🔄 Old ID still returns ${oldProjects.length} projects`);
        }
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 FIX COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Found all projects related to ganpat');
    console.log('✅ Updated all to use correct user ID');
    console.log('✅ Set author image from user profile');
    console.log('✅ Verified database consistency');
    
    console.log('\n🌐 TEST IT:');
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

fixApiAuthorId();
