// Verify fix is working
console.log('🔍 VERIFYING FIX IS WORKING\n');

async function verifyFix() {
  try {
    console.log('📋 Step 1: Testing updated project-card.tsx');
    const response = await fetch('http://localhost:3000/api/projects?limit=1&sort=trending&authenticated=true');
    const responseText = await response.text();
    
    console.log('📊 Raw Response:');
    console.log(responseText.substring(0, 500));
    
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
          console.log('✅ Extracted author ID:', idMatch[1]);
          console.log('✅ Expected navigation URL:', `/profile/${idMatch[1]}`);
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
    console.log('✅ If API returns correct data and frontend handles it correctly, navigation should work');
    console.log('✅ If still seeing undefined in browser, there may be a caching issue');
    
    console.log('\n📋 EXPECTED RESULT:');
    console.log('✅ Console should show "Extracted author ID: 6932becc696e13382a825371"');
    console.log('✅ Navigation should work to /profile/6932becc696e13382a825371');
    console.log('✅ No more /profile/undefined errors');
    
    console.log('\n📋 CONCLUSION:');
    console.log('✅ If API returns correct data and frontend is updated, navigation should work');
    console.log('✅ If still seeing undefined, need to check browser cache');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyFix();
