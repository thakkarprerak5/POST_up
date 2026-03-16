// Debug script to check trending projects API
console.log('🔍 Checking trending projects...');

// Test the trending API directly
fetch('/api/projects?limit=15&sort=trending')
  .then(response => {
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', [...response.headers.entries()]);
    return response.text();
  })
  .then(text => {
    console.log('📄 Raw API Response:', text);
    console.log('📏 Response Length:', text.length);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Parsed JSON data:', data);
      console.log('📊 Array length:', Array.isArray(data) ? data.length : 'Not an array');
      
      if (Array.isArray(data)) {
        data.forEach((project, index) => {
          console.log(`📁 Project ${index + 1}:`, {
            title: project.title,
            hasImages: project.images && project.images.length > 0,
            imageCount: project.images?.length || 0,
            likeCount: project.likeCount || 0,
            commentsCount: project.comments?.length || 0,
            shareCount: project.shareCount || 0,
            trendingScore: (project.likeCount || 0) + (project.comments?.length || 0) + (project.shareCount || 0),
            status: project.projectStatus
          });
        });
      }
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      console.log('🔍 First 200 chars:', text.substring(0, 200));
    }
  })
  .catch(error => {
    console.error('❌ Fetch Error:', error);
  });

// Also test regular projects API for comparison
fetch('/api/projects?limit=5')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Regular Projects API:', data);
    console.log('📊 Regular projects count:', Array.isArray(data) ? data.length : 'Not an array');
  })
  .catch(error => {
    console.error('❌ Regular API Error:', error);
  });
