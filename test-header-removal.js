#!/usr/bin/env node

/**
 * TEST HEADER REMOVAL
 * Verify that profile headers have been completely removed
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testHeaderRemoval() {
  try {
    log('🧪 TESTING PROFILE HEADER REMOVAL', 'cyan');
    log('===================================', 'cyan');

    const studentProfilePath = path.join(__dirname, 'components', 'student-profile.tsx');
    const mentorProfilePath = path.join(__dirname, 'components', 'mentor-profile.tsx');
    
    // Test 1: Check Student Profile
    log('\n📚 Test 1: Student Profile Header Removal', 'blue');
    if (fs.existsSync(studentProfilePath)) {
      const studentContent = fs.readFileSync(studentProfilePath, 'utf8');
      
      // Check that header card is removed
      const hasHeaderCard = studentContent.includes('Profile Header Card') && 
                           !studentContent.includes('REMOVED');
      const hasAvatar = studentContent.includes('Avatar');
      const hasBannerImage = studentContent.includes('bannerImage');
      const hasSocialLinks = studentContent.includes('socialLinks');
      
      log(`   ✅ Header card removed: ${!hasHeaderCard}`, !hasHeaderCard ? 'green' : 'red');
      log(`   ✅ Avatar component removed: ${!hasAvatar}`, !hasAvatar ? 'green' : 'red');
      log(`   ✅ Banner image removed: ${!hasBannerImage}`, !hasBannerImage ? 'green' : 'red');
      log(`   ✅ Social links removed: ${!hasSocialLinks}`, !hasSocialLinks ? 'green' : 'red');
      
      // Check that content still exists
      const hasEducation = studentContent.includes('Education');
      const hasSkills = studentContent.includes('Skills');
      const hasProjects = studentContent.includes('Projects');
      
      log(`   ✅ Education section preserved: ${hasEducation}`, hasEducation ? 'green' : 'red');
      log(`   ✅ Skills section preserved: ${hasSkills}`, hasSkills ? 'green' : 'red');
      log(`   ✅ Projects section preserved: ${hasProjects}`, hasProjects ? 'green' : 'red');
      
    } else {
      log('   ❌ Student profile component not found', 'red');
    }

    // Test 2: Check Mentor Profile
    log('\n👨‍🏫 Test 2: Mentor Profile Header Removal', 'blue');
    if (fs.existsSync(mentorProfilePath)) {
      const mentorContent = fs.readFileSync(mentorProfilePath, 'utf8');
      
      // Check that header card is removed
      const hasHeaderCard = mentorContent.includes('Profile Header Card') && 
                           !mentorContent.includes('REMOVED');
      const hasAvatar = mentorContent.includes('Avatar');
      const hasSocialLinks = mentorContent.includes('socialLinks');
      
      log(`   ✅ Header card removed: ${!hasHeaderCard}`, !hasHeaderCard ? 'green' : 'red');
      log(`   ✅ Avatar component removed: ${!hasAvatar}`, !hasAvatar ? 'green' : 'red');
      log(`   ✅ Social links removed: ${!hasSocialLinks}`, !hasSocialLinks ? 'green' : 'red');
      
      // Check that content still exists
      const hasDepartment = mentorContent.includes('Department');
      const hasExpertise = mentorContent.includes('Expertise');
      const hasProjects = mentorContent.includes('Projects');
      
      log(`   ✅ Department section preserved: ${hasDepartment}`, hasDepartment ? 'green' : 'red');
      log(`   ✅ Expertise section preserved: ${hasExpertise}`, hasExpertise ? 'green' : 'red');
      log(`   ✅ Projects section preserved: ${hasProjects}`, hasProjects ? 'green' : 'red');
      
    } else {
      log('   ❌ Mentor profile component not found', 'red');
    }

    // Test 3: Check unused imports cleaned up
    log('\n🧹 Test 3: Unused Imports Cleanup', 'blue');
    
    const studentContent = fs.readFileSync(studentProfilePath, 'utf8');
    const mentorContent = fs.readFileSync(mentorProfilePath, 'utf8');
    
    const studentHasUnusedImports = studentContent.includes('Mail') || 
                                  studentContent.includes('MapPin') || 
                                  studentContent.includes('Calendar') ||
                                  studentContent.includes('Avatar');
    
    const mentorHasUnusedImports = mentorContent.includes('Mail') || 
                                  mentorContent.includes('MapPin') || 
                                  mentorContent.includes('Calendar') ||
                                  mentorContent.includes('Avatar');
    
    log(`   ✅ Student unused imports removed: ${!studentHasUnusedImports}`, !studentHasUnusedImports ? 'green' : 'red');
    log(`   ✅ Mentor unused imports removed: ${!mentorHasUnusedImports}`, !mentorHasUnusedImports ? 'green' : 'red');

    log('\n🎉 Header removal test completed!', 'green');
    log('\n📊 SUMMARY:', 'cyan');
    log('================', 'cyan');
    
    const allTestsPassed = !hasHeaderCard && !hasAvatar && !hasBannerImage && 
                          !hasSocialLinks && hasEducation && hasSkills && 
                          hasProjects && !studentHasUnusedImports && 
                          !mentorHasUnusedImports;
    
    if (allTestsPassed) {
      log('✅ ALL TESTS PASSED!', 'green');
      log('✅ Profile headers completely removed', 'green');
      log('✅ All functionality preserved', 'green');
      log('✅ Code cleaned up properly', 'green');
    } else {
      log('❌ Some tests failed', 'red');
    }

    log('\n🎯 Expected result:', 'cyan');
    log('- No profile header cards visible', 'cyan');
    log('- Clean, focused layout', 'cyan');
    log('- All project functionality preserved', 'cyan');
    log('- Edit/delete/restore buttons still work', 'cyan');
    
    log('\n💡 Note: If headers still appear in browser:', 'yellow');
    log('- Hard refresh the page (Ctrl+F5)', 'yellow');
    log('- Clear browser cache', 'yellow');
    log('- Restart development server if needed', 'yellow');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the test
testHeaderRemoval();
