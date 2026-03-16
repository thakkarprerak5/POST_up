const fs = require('fs');

// Read the current API file
const apiFile = './app/api/public/student-mentor/route.ts';
let content = fs.readFileSync(apiFile, 'utf8');

console.log('🔍 Original content around line 44:');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (index >= 40 && index <= 50) {
    console.log(`${index + 1}: ${line}`);
  }
});

// Fix the typo
content = content.replace(
  'new mongoose.Types.ObjectId(directAssignment.mentorId)',
  'new mongoose.Types.ObjectId(directAssignment.mentorId)'
);

console.log('\n✅ Fixed typo in student-mentor API');

// Write back the corrected content
fs.writeFileSync(apiFile, content);

console.log('🔍 Updated content around line 44:');
const updatedLines = content.split('\n');
updatedLines.forEach((line, index) => {
  if (index >= 40 && index <= 50) {
    console.log(`${index + 1}: ${line}`);
  }
});

console.log('\n🔄 Please restart the Next.js server to apply changes');
