// Debug author ID issue
console.log('🔍 DEBUGGING AUTHOR ID ISSUE\n');

async function debugAuthorId() {
  try {
    console.log('📋 Step 1: Testing projects API to see actual data structure');
    const response = await fetch('http://localhost:3000/api/projects?limit=2&sort=trending&authenticated=true');
    const responseText = await response.text();
    
    console.log('📊 Raw Response (first 800 chars):');
    console.log(responseText.substring(0, 800));
    
    // Look for ganpat project specifically
    const ganpatMatch = responseText.match(/"title":"website".*?"author":\s*({[^}]+)}\s*}/);
    
    if (ganpatMatch) {
      const ganpatAuthorData = ganpatMatch[0];
      console.log('📊 Ganpat author data:', ganpatAuthorData);
      
      // Check if author.id is present
      if (ganpatAuthorData.includes('"id":"')) {
        console.log('✅ Ganpat author.id found in API response');
        
        // Extract the actual ID
        const idMatch = ganpatAuthorData.match(/"id":"([^"]+)"/);
        if (idMatch) {
          const authorId = idMatch[1];
          console.log('✅ Extracted author ID:', authorId);
          console.log('✅ Expected navigation URL:', `/profile/${authorId}`);
          
          // Check if this matches current user ID
          console.log('🔍 CHECKING IF THIS IS CURRENT USER ID:');
          console.log('✅ Author ID from API:', authorId);
          
          // Test if navigation would work correctly
          if (authorId && authorId !== 'undefined' && authorId !== 'null' && authorId !== '') {
            console.log('✅ Navigation should work to:', `/profile/${authorId}`);
          } else {
            console.log('❌ Author ID is invalid:', authorId);
          }
        } else {
          console.log('❌ Could not extract author ID');
        }
      } else {
        console.log('❌ Ganpat author.id missing from API response');
      }
    } else {
      console.log('❌ Ganpat project not found in response');
    }
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ If API returns correct author.id, issue is in frontend');
    console.log('✅ If frontend is using wrong field, need to fix');
    console.log('✅ If navigation goes to wrong profile, need to check data flow');
    
    console.log('\n📋 SOLUTION:');
    console.log('✅ Ensure frontend uses correct author.id field');
    console.log('✅ Check if there are multiple ID fields');
    console.log('✅ Verify navigation uses correct ID');
    
    console.log('\n🎉 DEBUG COMPLETE!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAuthorId();
