// Test script to verify tag-based categorization
const { categoryTagMapping, categorizeProject, countProjectsByCategory } = require('./lib/category-mapping.ts');

// Sample projects with different tags
const sampleProjects = [
  {
    _id: '1',
    title: 'React Dashboard',
    tags: ['react', 'nextjs', 'typescript', 'web'],
    author: { name: 'John Doe' }
  },
  {
    _id: '2', 
    title: 'ML Model',
    tags: ['python', 'machine-learning', 'ai', 'tensorflow'],
    author: { name: 'Jane Smith' }
  },
  {
    _id: '3',
    title: 'Mobile App',
    tags: ['flutter', 'mobile', 'android', 'ios'],
    author: { name: 'Bob Johnson' }
  },
  {
    _id: '4',
    title: 'Security Tool',
    tags: ['security', 'cyber', 'pentesting', 'network'],
    author: { name: 'Alice Brown' }
  },
  {
    _id: '5',
    title: 'Data Dashboard',
    tags: ['python', 'data', 'analytics', 'visualization'],
    author: { name: 'Charlie Wilson' }
  },
  {
    _id: '6',
    title: 'Blockchain App',
    tags: ['blockchain', 'web3', 'solidity', 'crypto'],
    author: { name: 'Diana Prince' }
  }
];

console.log('🧪 Testing Tag-Based Categorization System\n');

// Test individual project categorization
console.log('📋 Individual Project Categorization:');
sampleProjects.forEach(project => {
  const categories = categorizeProject(project.tags);
  console.log(`  "${project.title}" (${project.tags.join(', ')}) → ${categories.join(', ') || 'No category'}`);
});

console.log('\n📊 Category Counts:');
const counts = countProjectsByCategory(sampleProjects);
categoryTagMapping.forEach(category => {
  console.log(`  ${category.name}: ${counts[category.slug]} projects`);
});

console.log('\n✅ Test completed!');
