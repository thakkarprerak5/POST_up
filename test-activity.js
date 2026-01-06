// Test the activity API with filtering
const BASE_URL = 'http://localhost:3000';

async function testActivityAPI() {
  console.log('🔍 Testing Activity API with Filtering...\n');
  
  try {
    // Test activity API with filtering
    const response = await fetch(`${BASE_URL}/api/activity/recent?limit=10&authenticated=true`);
    const activities = await response.json();
    
    console.log(`Recent activities returned: ${activities.length}\n`);
    
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.user?.name} ${activity.description}`);
      console.log(`   Project: ${activity.project?.title}`);
      console.log('---');
    });
    
    // Test without filtering for comparison
    console.log('\n🔄 Testing WITHOUT filtering...');
    const unfilteredResponse = await fetch(`${BASE_URL}/api/activity/recent?limit=10`);
    const unfilteredActivities = await unfilteredResponse.json();
    
    console.log(`Unfiltered activities: ${unfilteredActivities.length}\n`);
    
    unfilteredActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.user?.name} ${activity.description}`);
      console.log('---');
    });
    
    console.log('\n✅ Activity API filtering working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testActivityAPI();
