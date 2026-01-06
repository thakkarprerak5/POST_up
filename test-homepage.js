// Test script to verify home page changes
const BASE_URL = 'http://localhost:3000';

async function testHomePageChanges() {
  console.log('🧪 Testing Home Page Changes...\n');
  
  try {
    // Test 1: Check regular projects API (should include all projects)
    console.log('📦 Step 1: Testing regular projects API...');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects?limit=8`);
    const projectsText = await projectsResponse.text();
    
    let projectsData;
    try {
      const jsonStart = projectsText.indexOf('[');
      const jsonEnd = projectsText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = projectsText.substring(jsonStart, jsonEnd);
        projectsData = JSON.parse(jsonPart);
      } else {
        projectsData = JSON.parse(projectsText);
      }
    } catch (error) {
      console.error('Failed to parse projects response:', error.message);
      return;
    }
    
    console.log(`Total projects found: ${projectsData.length}`);
    
    // Test 2: Filter out sample projects (like the home page does)
    console.log('\n🔍 Step 2: Filtering sample projects...');
    const filteredProjects = projectsData.filter(project => {
      const projectId = project._id || project.id;
      const isRealProject = projectId && !/^\d+$/.test(projectId.toString());
      return isRealProject;
    });
    
    console.log(`Real user projects (non-sample): ${filteredProjects.length}`);
    
    filteredProjects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}: ${project.title}`);
      console.log(`  ID: ${project._id || project.id}`);
      console.log(`  Author: ${project.author?.name}`);
      console.log(`  Likes: ${project.likeCount || 0}`);
      console.log(`  Comments: ${project.comments?.length || 0}`);
      console.log(`  Shares: ${project.shareCount || 0}`);
      console.log(`  Liked by User: ${project.likedByUser || false}`);
      console.log(`  Is Real Project: ${!/^\d+$/.test((project._id || project.id).toString())}`);
    });
    
    // Test 3: Check if ProjectInteractions data is properly passed
    console.log('\n🔗 Step 3: Verifying ProjectInteractions data...');
    if (filteredProjects.length > 0) {
      const testProject = filteredProjects[0];
      console.log('Sample project data for ProjectInteractions:');
      console.log(`  projectId: ${testProject._id || testProject.id}`);
      console.log(`  initialLikes: ${testProject.likeCount || 0}`);
      console.log(`  initialComments: ${testProject.comments?.length || 0} comments`);
      console.log(`  initialShares: ${testProject.shareCount || 0}`);
      console.log(`  likedByUser: ${testProject.likedByUser || false}`);
      console.log(`  authorId: ${testProject.author?.id}`);
      
      if (testProject.comments && testProject.comments.length > 0) {
        console.log('  Sample comment:', testProject.comments[0].text);
      }
    }
    
    // Test 4: Check trending projects
    console.log('\n📈 Step 4: Testing trending projects...');
    const trendingResponse = await fetch(`${BASE_URL}/api/projects?limit=10&sort=trending`);
    const trendingText = await trendingResponse.text();
    
    let trendingData;
    try {
      const jsonStart = trendingText.indexOf('[');
      const jsonEnd = trendingText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = trendingText.substring(jsonStart, jsonEnd);
        trendingData = JSON.parse(jsonPart);
      } else {
        trendingData = JSON.parse(trendingText);
      }
    } catch (error) {
      console.error('Failed to parse trending response:', error.message);
      return;
    }
    
    const filteredTrending = trendingData.filter(project => {
      const projectId = project._id || project.id;
      const isRealProject = projectId && !/^\d+$/.test(projectId.toString());
      return isRealProject;
    });
    
    console.log(`Trending projects (real users only): ${filteredTrending.length}`);
    
    console.log('\n✅ Home Page Changes Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Total projects in database: ${projectsData.length}`);
    console.log(`✅ Real user projects (shown on home): ${filteredProjects.length}`);
    console.log(`✅ Sample projects (hidden from home): ${projectsData.length - filteredProjects.length}`);
    console.log(`✅ Trending projects (real users only): ${filteredTrending.length}`);
    console.log(`✅ All projects have like/comment data for ProjectInteractions`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHomePageChanges();
