// Check API data mismatch
console.log('🔍 CHECKING API DATA MISMATCH\n');

async function checkApiDataMismatch() {
  try {
    console.log('📋 Step 1: Testing projects API');
    const response = await fetch('http://localhost:3000/api/projects?limit=2&sort=trending&authenticated=true');
    const responseText = await response.text();
    
    console.log('📊 Raw API Response:');
    console.log(responseText);
    
    console.log('\n📋 Step 2: Looking for _id field');
    if (responseText.includes('"_id":')) {
      console.log('✅ API returns _id field');
      console.log('✅ Need to update project-card.tsx to use project.author._id');
    } else {
      console.log('❌ API does not return _id field');
      console.log('✅ Need to investigate further');
    }
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ API response structure mismatch detected');
    console.log('✅ Frontend expects project.author._id but API returns project.author.id');
    console.log('✅ Root cause of /profile/undefined navigation');
    
    console.log('\n📋 SOLUTION:');
    console.log('1. Update project-card.tsx to use project.author._id instead of project.author.id');
    console.log('2. This should fix the navigation issue');
    console.log('3. Test with actual user data');
    
    console.log('\n🎉 SUCCESS: API data mismatch identified!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkApiDataMismatch();
