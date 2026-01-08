// Check detailed API response
console.log('🔍 CHECKING DETAILED API RESPONSE\n');

async function checkApiResponseDetailed() {
  try {
    console.log('📋 Step 1: Testing projects API with authentication');
    const response = await fetch('http://localhost:3000/api/projects?limit=8&authenticated=true');
    const responseText = await response.text();
    
    console.log('📊 Raw Response (first 500 chars):');
    console.log(responseText.substring(0, 500));
    
    console.log('\n📋 Step 2: Looking for author.id in response');
    if (responseText.includes('"author":{"id":')) {
      console.log('✅ Found author.id field in response');
      
      // Extract the first project to check structure
      const firstProjectMatch = responseText.match(/"author":\s*({[^}]+)}\s*}/);
      if (firstProjectMatch) {
        const authorData = firstProjectMatch[0];
        console.log('📊 First project author data:', authorData);
        
        // Check if author.id is present
        if (authorData.includes('"id":')) {
          console.log('✅ Author.id field found in API response');
        } else {
          console.log('❌ Author.id field missing from API response');
        }
      }
    } else {
      console.log('❌ No author data found in API response');
    }
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to verify API returns correct author.id field');
    console.log('✅ If API returns author.id, issue is in frontend');
    console.log('✅ If API does not return author.id, need to fix API');
    
    console.log('\n🎉 DETAILED CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkApiResponseDetailed();
