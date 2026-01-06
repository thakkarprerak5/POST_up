// Debug comment functionality issues
const BASE_URL = 'http://localhost:3000';

async function debugCommentIssues() {
  console.log('🔍 Debugging Comment Functionality Issues...\n');
  
  try {
    // Test 1: Check if user is authenticated
    console.log('🔑 Test 1: Check authentication status');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User is logged in: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
    } else {
      console.log('❌ User is NOT logged in');
      console.log('   → Comment options will not be visible without login');
      console.log('   → Please log in to see comment functionality');
    }
    
    // Test 2: Check if projects have comment buttons
    console.log('\n📦 Test 2: Check project data structure');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`✅ Found project: ${project.title}`);
      console.log(`   Comments array: ${project.comments ? project.comments.length : 0} comments`);
      console.log(`   Comment count: ${project.comments ? project.comments.length : 0}`);
      console.log(`   Project ID: ${project.id}`);
      
      // Test 3: Check if comment API works
      console.log('\n📝 Test 3: Test comment API endpoint');
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      console.log(`   Comments API status: ${commentsResponse.status}`);
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`   Comments API working: ${commentsData.comments?.length || 0} comments found`);
      } else {
        console.log(`   ❌ Comments API failed: ${commentsResponse.status}`);
      }
      
    } else {
      console.log('❌ No projects found');
    }
    
    // Test 4: Check home page HTML structure
    console.log('\n🌐 Test 4: Check home page accessibility');
    const homePageResponse = await fetch(`${BASE_URL}/`);
    console.log(`   Home page status: ${homePageResponse.status}`);
    
    if (homePageResponse.ok) {
      console.log('✅ Home page is accessible');
    } else {
      console.log('❌ Home page not accessible');
    }
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure you are LOGGED IN (required for comments)');
    console.log('2. Check if you can see the comment button (message bubble icon)');
    console.log('3. Click the comment button to open the comment modal');
    console.log('4. Look for the input field at the bottom of the modal');
    console.log('5. Edit/Delete buttons appear only on YOUR own comments');
    
    console.log('\n📋 EXPECTED BEHAVIOR:');
    console.log('- Comment button shows count of comments');
    console.log('- Click to open modal with comment list');
    console.log('- Input field at bottom for new comments');
    console.log('- Edit (pencil) and Delete (trash) buttons on your comments');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugCommentIssues();
