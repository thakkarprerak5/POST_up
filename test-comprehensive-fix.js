// Comprehensive test for project-user relationship fixes
async function testComprehensiveFix() {
  console.log('🧪 Comprehensive Project-User Relationship Test\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Get all projects and analyze author structure
    console.log('📋 Step 1: Analyzing all projects...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }
    
    const allProjects = await projectsResponse.json();
    console.log(`✅ Found ${allProjects.length} total projects`);
    
    if (allProjects.length === 0) {
      console.log('❌ No projects found to test with');
      return;
    }
    
    // Analyze author structure
    const authorStructures = allProjects.map(p => ({
      title: p.title,
      hasAuthorId: !!p.author?.id,
      hasAuthorName: !!p.author?.name,
      hasAuthorImage: !!p.author?.image,
      authorId: p.author?.id,
      authorName: p.author?.name
    }));
    
    console.log('\n📊 Author Structure Analysis:');
    authorStructures.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title}`);
      console.log(`      Author ID: ${project.hasAuthorId ? '✅' : '❌'} ${project.authorId || 'Missing'}`);
      console.log(`      Author Name: ${project.hasAuthorName ? '✅' : '❌'} ${project.authorName || 'Missing'}`);
      console.log(`      Author Image: ${project.hasAuthorImage ? '✅' : '❌'}`);
    });
    
    // Test 2: Test user projects endpoint for each unique author
    console.log('\n👤 Step 2: Testing user projects endpoints...');
    const uniqueAuthorIds = [...new Set(authorStructures.map(p => p.authorId).filter(Boolean))];
    
    for (const authorId of uniqueAuthorIds) {
      console.log(`\n   Testing author ID: ${authorId}`);
      const userProjectsResponse = await fetch(`${baseUrl}/api/users/${authorId}/projects`);
      
      if (userProjectsResponse.ok) {
        const userProjects = await userProjectsResponse.json();
        const expectedProjects = authorStructures.filter(p => p.authorId === authorId);
        
        console.log(`   ✅ Found ${userProjects.length} projects (expected: ${expectedProjects.length})`);
        
        if (userProjects.length !== expectedProjects.length) {
          console.log(`   ⚠️  Mismatch! Expected ${expectedProjects.length} but got ${userProjects.length}`);
        }
      } else {
        console.log(`   ❌ Failed with status: ${userProjectsResponse.status}`);
      }
    }
    
    // Test 3: Test project detail endpoints
    console.log('\n🔍 Step 3: Testing project detail endpoints...');
    for (let i = 0; i < Math.min(3, allProjects.length); i++) {
      const project = allProjects[i];
      console.log(`   Testing project: ${project.title}`);
      
      const detailResponse = await fetch(`${baseUrl}/api/projects/${project._id}`);
      if (detailResponse.ok) {
        const detailProject = await detailResponse.json();
        console.log(`   ✅ Project detail loaded successfully`);
        console.log(`      Author: ${detailProject.author?.name || 'Unknown'}`);
      } else {
        console.log(`   ❌ Failed with status: ${detailResponse.status}`);
      }
    }
    
    console.log('\n🎉 Test Summary:');
    console.log(`✅ Projects API: Working`);
    console.log(`✅ Author Structure: Analyzed`);
    console.log(`✅ User Projects API: Tested`);
    console.log(`✅ Project Detail API: Tested`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testComprehensiveFix();
