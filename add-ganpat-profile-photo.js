// Add a profile photo for ganpat user
console.log('📸 ADDING GANPAT PROFILE PHOTO\n');

async function addGanpatProfilePhoto() {
  try {
    console.log('📋 Step 1: Connecting to database');
    
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('📋 Step 2: Finding ganpat user');
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found ganpat user:');
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   Name: ${ganpatUser.fullName}`);
    console.log(`   Current photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    console.log('\n📋 Step 3: Setting profile photo');
    
    // You can change this to any image URL you want
    const profilePhotoUrl = '/uploads/ganpat-profile-photo.jpg';
    
    console.log(`   Setting photo to: ${profilePhotoUrl}`);
    
    // Update ganpat's photo in the database
    const result = await usersCollection.updateOne(
      { email: 'ganpat@example.com' },
      { 
        $set: { 
          photo: profilePhotoUrl 
        }
      }
    );
    
    console.log(`✅ Update result: ${result.modifiedCount} document(s) modified`);
    
    // Also update ganpat's project to use the new photo
    console.log('\n📋 Step 4: Updating ganpat project');
    const projectsCollection = db.collection('projects');
    
    const projectUpdateResult = await projectsCollection.updateMany(
      { 'author.name': 'ganpat' },
      { 
        $set: { 
          'author.image': profilePhotoUrl,
          'author.avatar': profilePhotoUrl
        }
      }
    );
    
    console.log(`✅ Project update result: ${projectUpdateResult.modifiedCount} project(s) modified`);
    
    // Verify the update
    console.log('\n📋 Step 5: Verification');
    const updatedUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    const updatedProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    
    console.log('✅ Updated user photo:', updatedUser.photo);
    console.log('✅ Updated project image:', updatedProject.author?.image);
    console.log('✅ Updated project avatar:', updatedProject.author?.avatar);
    
    await mongoose.disconnect();
    
    console.log('\n🎯 SUCCESS!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Added profile photo to ganpat user record');
    console.log('✅ Updated ganpat projects to use new photo');
    console.log('✅ Both user and project now reference the same photo');
    
    console.log('\n🔍 NEXT STEPS:');
    console.log('1. Create the image file: /public/uploads/ganpat-profile-photo.jpg');
    console.log('2. Refresh browser (Ctrl+F5)');
    console.log('3. Go to: http://localhost:3000');
    console.log('4. Look for ganpat\'s "website" project');
    console.log('5. Profile photo should now be visible');
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('👤 [ganpat\'s actual profile photo] ganpat');
    console.log('✅ Clean, professional appearance');
    console.log('✅ Working navigation to profile');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addGanpatProfilePhoto();
