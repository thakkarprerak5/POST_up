// Replace old implementation with new one
console.log('🔄 REPLACING WITH NEW IMPLEMENTATION\n');

const fs = require('fs');
const path = require('path');

async function replaceWithNewImplementation() {
  try {
    console.log('📋 Step 1: Backing up old files');
    
    const projectCardOld = path.join(__dirname, 'components/project-card.tsx');
    const projectCardNew = path.join(__dirname, 'components/project-card-new.tsx');
    const apiRouteOld = path.join(__dirname, 'app/api/projects/route.ts');
    const apiRouteNew = path.join(__dirname, 'app/api/projects/route-new.ts');
    
    // Backup old files
    if (fs.existsSync(projectCardOld)) {
      fs.copyFileSync(projectCardOld, path.join(__dirname, 'components/project-card-backup.tsx'));
      console.log('✅ Backed up project-card.tsx');
    }
    
    if (fs.existsSync(apiRouteOld)) {
      fs.copyFileSync(apiRouteOld, path.join(__dirname, 'app/api/projects/route-backup.ts'));
      console.log('✅ Backed up route.ts');
    }
    
    console.log('\n📋 Step 2: Replacing with new implementation');
    
    // Replace project card
    if (fs.existsSync(projectCardNew)) {
      fs.copyFileSync(projectCardNew, projectCardOld);
      fs.unlinkSync(projectCardNew);
      console.log('✅ Replaced project-card.tsx with new implementation');
    }
    
    // Replace API route
    if (fs.existsSync(apiRouteNew)) {
      fs.copyFileSync(apiRouteNew, apiRouteOld);
      fs.unlinkSync(apiRouteNew);
      console.log('✅ Replaced route.ts with new implementation');
    }
    
    console.log('\n📋 Step 3: Cleaning up test files');
    
    // Remove test files
    const testFiles = [
      'debug-author-name.js',
      'final-debug-test.js',
      'enhanced-debug-test.js',
      'debug-browser-live.js',
      'test-simple-profile-photo.js',
      'test-basic-avatar.html',
      'ultimate-final-test.js',
      'debug-homepage-projects.js',
      'test-fallback-approach.js',
      'test-user-photo-logic.js',
      'final-clean-solution.js',
      'check-user-actual-photo.js',
      'test-image-directly.js',
      'debug-test-instructions.js',
      'test-conditional-logic.js',
      'final-success-test.js',
      'debug-real-time.js',
      'simple-profile-photo-backup.tsx',
      'ganpat-avatar-backup.tsx',
      'check-current-state.js',
      'verify-database-update.js',
      'test-new-image.js',
      'final-instructions.js',
      'debug-after-restart.js',
      'test-api-fix.js'
    ];
    
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed ${file}`);
      }
    });
    
    console.log('\n🎉 REPLACEMENT COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Backed up old files');
    console.log('✅ Replaced project-card.tsx with new implementation');
    console.log('✅ Replaced route.ts with new implementation');
    console.log('✅ Cleaned up test files');
    
    console.log('\n🎯 NEW IMPLEMENTATION FEATURES:');
    console.log('✅ Clean profile photo logic');
    console.log('✅ No hardcoded values');
    console.log('✅ Proper fallback to initial letter');
    console.log('✅ Database-driven profile photos');
    console.log('✅ Error handling for failed images');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Restart the server');
    console.log('2. Refresh browser (Ctrl+F5)');
    console.log('3. Go to: http://localhost:3000');
    console.log('4. Look for ganpat\'s "website" project');
    console.log('5. Profile photo should now be visible');
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('👤 [ganpat\'s actual profile photo] ganpat');
    console.log('✅ Clean, professional appearance');
    console.log('✅ Working navigation to profile');
    
    console.log('\n🔧 IF STILL NOT WORKING:');
    console.log('1. Check browser console for errors');
    console.log('2. Check Network tab for image requests');
    console.log('3. Check Elements panel for HTML structure');
    console.log('4. Verify API response in browser');
    
    console.log('\n🎉 NEW IMPLEMENTATION IS READY!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replaceWithNewImplementation();
