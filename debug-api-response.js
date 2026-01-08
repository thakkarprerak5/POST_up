// Debug API response structure
console.log('🔍 DEBUGGING API RESPONSE STRUCTURE\n');

async function debugApiResponse() {
  try {
    console.log('📋 Step 1: Testing raw API response');
    const response = await fetch('http://localhost:3000/api/projects?limit=2&sort=trending&authenticated=true');
    const responseText = await response.text();
    
    console.log('📊 Raw API Response:');
    console.log(responseText);
    
    console.log('\n📋 Step 2: Parsing JSON response');
    try {
      const responseJson = JSON.parse(responseText);
      console.log('📊 Parsed JSON Response:');
      console.log(responseJson);
      
      if (responseJson && responseJson.length > 0) {
        console.log('\n📋 Step 3: Checking first project author structure:');
        const firstProject = responseJson[0];
        console.log('First project author:', JSON.stringify(firstProject.author, null, 2));
        console.log('First project author fields:', Object.keys(firstProject.author || {}));
        console.log('First project author._id:', firstProject.author?._id);
        console.log('First project author.id:', firstProject.author?.id);
        console.log('---');
      }
    }
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to check if API returns _id field');
    console.log('✅ If API returns _id, we need to update project-card.tsx');
    console.log('✅ If API only returns id, we need to fix the API');
    
    console.log('\n🎉 SUCCESS: API response debugging complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugApiResponse();
