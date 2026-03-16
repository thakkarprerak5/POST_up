// Fix existing projects by adding appropriate tags based on their titles/descriptions
const { categoryTagMapping } = require('./lib/category-mapping.ts');

// Sample tag mapping based on common project patterns
const titleToTags = {
  'Stock Prediction': ['ai', 'ml', 'machine-learning', 'python', 'data', 'analytics'],
  'Weather App': ['mobile', 'web', 'react', 'javascript', 'api'],
  'E-commerce': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'javascript'],
  'Chat App': ['web', 'react', 'nodejs', 'socket.io', 'javascript', 'real-time'],
  'Task Manager': ['web', 'react', 'javascript', 'productivity', 'frontend'],
  'Portfolio': ['web', 'react', 'javascript', 'frontend', 'css'],
  'Blog Platform': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'cms'],
  'Social Media': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'social'],
  'Video Player': ['web', 'javascript', 'html5', 'css', 'media'],
  'Music Player': ['web', 'javascript', 'html5', 'css', 'media', 'audio'],
  'Calculator': ['web', 'javascript', 'html', 'css', 'utility'],
  'Todo App': ['web', 'react', 'javascript', 'productivity', 'frontend'],
  'Game': ['web', 'javascript', 'html5', 'css', 'gaming'],
  'API': ['web', 'nodejs', 'express', 'backend', 'api'],
  'Database': ['data', 'sql', 'nosql', 'backend', 'database'],
  'Security': ['security', 'cyber', 'web', 'backend', 'authentication'],
  'Blockchain': ['blockchain', 'web3', 'crypto', 'solidity', 'smart-contracts'],
  'Mobile': ['mobile', 'android', 'ios', 'flutter', 'react-native'],
  'AI': ['ai', 'ml', 'machine-learning', 'python', 'tensorflow', 'pytorch'],
  'Data': ['data', 'analytics', 'python', 'visualization', 'dashboard']
};

function getTagsFromTitle(title) {
  const tags = [];
  const lowerTitle = title.toLowerCase();
  
  // Check for keywords in title
  Object.entries(titleToTags).forEach(([keyword, keywordTags]) => {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      tags.push(...keywordTags);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

console.log('🔧 Tag fixing utility loaded');
console.log('📝 Example tags for "Stock Prediction":', getTagsFromTitle('Stock Prediction'));
console.log('📝 Example tags for "Weather App":', getTagsFromTitle('Weather App'));
