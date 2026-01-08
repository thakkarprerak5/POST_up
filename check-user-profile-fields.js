// Check user profile fields in database
console.log('🔍 CHECKING USER PROFILE FIELDS IN DATABASE\n');

async function checkUserProfileFields() {
  try {
    console.log('📋 Step 1: Testing profile API');
    const response = await fetch('http://localhost:3000/api/profile?id=6932becc696e13382a825371');
    const profile = await response.json();
    
    console.log('📊 Profile API Response:');
    console.log('Full profile object:', JSON.stringify(profile, null, 2));
    console.log('Available fields:', Object.keys(profile || {}));
    
    console.log('\n📋 Step 2: Checking specific fields:');
    console.log('Profile photo field:', profile.photo);
    console.log('Profile image field:', profile.image);
    console.log('Profile profile.photo field:', profile.profile?.photo);
    console.log('Profile profile.image field:', profile.profile?.image);
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to identify correct field for profile photo');
    console.log('✅ Need to update project-card.tsx to use correct field');
    console.log('✅ Need to ensure author data is properly loaded');
    
    console.log('\n📋 Step 3: Testing ganpat specifically');
    const ganpatResponse = await fetch('http://localhost:3000/api/profile?id=6932becc696e13382a825371');
    const ganpatProfile = await ganpatResponse.json();
    
    console.log('Ganpat profile photo fields:');
    console.log('Photo:', ganpatProfile.photo);
    console.log('Image:', ganpatProfile.image);
    console.log('Profile.photo:', ganpatProfile.profile?.photo);
    console.log('Profile.image:', ganpatProfile.profile?.image);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Use profile.photo or profile.image field');
    console.log('2. Update project-card.tsx to use correct field');
    console.log('3. Test with actual user data');
    console.log('4. Ensure author data is available before rendering');
    
    console.log('\n🎉 PROFILE FIELD ANALYSIS COMPLETE!');
    
  } catch (error) {
    console.error('❌ Profile field check failed:', error.message);
  }
}

checkUserProfileFields();
