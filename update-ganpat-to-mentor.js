const mongoose = require('mongoose');

async function updateGanpatToMentor() {
  try {
    console.log('🎓 Updating Ganpat to Mentor Role\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat User:');
    console.log(`   Current Type: ${ganpatUser.type}`);
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   User ID: ${ganpatUser._id}`);
    
    // Update ganpat to be a mentor
    console.log('\n🔄 Updating to Mentor Role...');
    await usersCollection.updateOne(
      { _id: ganpatUser._id },
      { 
        $set: { 
          type: 'mentor',
          'profile.type': 'mentor',
          'profile.position': 'Senior Web Developer',
          'profile.experience': 5,
          'profile.expertise': ['Web Development', 'JavaScript', 'React', 'Node.js', 'Full Stack Development'],
          'profile.department': 'Computer Science & Engineering',
          'profile.researchAreas': ['Web Technologies', 'Software Architecture'],
          'profile.achievements': ['10+ years in industry', 'Mentored 50+ students', 'Open source contributor'],
          'profile.officeHours': 'Mon-Fri 2PM-4PM',
          'profile.socialLinks': {
            github: 'https://github.com/ganpat',
            linkedin: 'https://linkedin.com/in/ganpat',
            portfolio: 'https://ganpat.dev'
          }
        }
      }
    );
    
    console.log('✅ Ganpat updated to Mentor role!');
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    console.log('\n📋 Updated Mentor Profile:');
    console.log(`   Type: ${updatedUser.type}`);
    console.log(`   Position: ${updatedUser.profile.position}`);
    console.log(`   Experience: ${updatedUser.profile.experience} years`);
    console.log(`   Expertise: ${updatedUser.profile.expertise.join(', ')}`);
    console.log(`   Office Hours: ${updatedUser.profile.officeHours}`);
    
    // Test if ganpat appears in mentors API
    console.log('\n🎓 Testing Mentors API...');
    try {
      const fetch = require('node-fetch');
      const mentorsResponse = await fetch('http://localhost:3000/api/mentors');
      if (mentorsResponse.ok) {
        const mentors = await mentorsResponse.json();
        const ganpatMentor = mentors.find(m => m.email === 'ganpat@example.com');
        
        if (ganpatMentor) {
          console.log('✅ Ganpat appears in Mentors API!');
          console.log(`   Name: ${ganpatMentor.fullName}`);
          console.log(`   Type: ${ganpatMentor.type}`);
          console.log(`   Position: ${ganpatMentor.profile?.position || 'Not set'}`);
        } else {
          console.log('❌ Ganpat not found in Mentors API');
        }
      } else {
        console.log(`❌ Mentors API failed: ${mentorsResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 GANPAT MENTOR UPDATE COMPLETE!');
    console.log('\n📋 WHAT WAS UPDATED:');
    console.log('✅ User type changed from "student" to "mentor"');
    console.log('✅ Added mentor-specific profile fields');
    console.log('✅ Set professional experience and expertise');
    console.log('✅ Added office hours and social links');
    console.log('✅ Will now appear in mentors directory');
    
    console.log('\n🔑 LOGIN INFO (unchanged):');
    console.log('   Email: ganpat@example.com');
    console.log('   Password: password123');
    
    console.log('\n🌐 MENTOR FEATURES:');
    console.log('• Will appear in /mentors page');
    console.log('• Students can follow mentor');
    console.log('• Mentor profile shows expertise');
    console.log('• Office hours displayed');
    console.log('• Professional portfolio links');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateGanpatToMentor();
