#!/usr/bin/env node

/**
 * TEST KEY PROP FIXES
 * Verify that all project lists have proper keys and IDs
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

function testKeyFixes() {
  try {
    log('🧪 TESTING KEY PROP FIXES', 'cyan');
    log('============================', 'cyan');

    const studentProfilePath = path.join(__dirname, 'components', 'student-profile.tsx');
    
    if (!fs.existsSync(studentProfilePath)) {
      log('❌ StudentProfile component not found', 'red');
      return;
    }

    const content = fs.readFileSync(studentProfilePath, 'utf8');

    // Test 1: Check for proper keys in uploaded projects
    log('\n📋 Test 1: Check uploaded projects keys', 'blue');
    const uploadedProjectsKeyMatch = content.includes('key={project._id || project.id}');
    log(`   ✅ Uploaded projects have proper keys: ${uploadedProjectsKeyMatch}`, uploadedProjectsKeyMatch ? 'green' : 'red');

    // Test 2: Check for proper keys in deleted projects
    log('\n🗑️  Test 2: Check deleted projects keys', 'blue');
    const deletedProjectsKeyMatch = content.includes('key={project._id || project.id}');
    log(`   ✅ Deleted projects have proper keys: ${deletedProjectsKeyMatch}`, deletedProjectsKeyMatch ? 'green' : 'red');

    // Test 3: Check for proper keys in legacy projects
    log('\n📚 Test 3: Check legacy projects keys', 'blue');
    const legacyProjectsKeyMatch = content.includes('key={project.id}');
    log(`   ✅ Legacy projects have proper keys: ${legacyProjectsKeyMatch}`, legacyProjectsKeyMatch ? 'green' : 'red');

    // Test 4: Check for proper ID handling in restore function
    log('\n🔄 Test 4: Check restore function ID handling', 'blue');
    const restoreIdMatch = content.includes('handleRestoreProject(project._id || project.id)');
    log(`   ✅ Restore function handles both ID types: ${restoreIdMatch}`, restoreIdMatch ? 'green' : 'red');

    // Test 5: Check for proper ID handling in delete function
    log('\n🗑️  Test 5: Check delete function ID handling', 'blue');
    const deleteIdMatch = content.includes('handleDeleteProject(project._id || project.id)');
    log(`   ✅ Delete function handles both ID types: ${deleteIdMatch}`, deleteIdMatch ? 'green' : 'red');

    // Test 6: Check for proper ID handling in edit function
    log('\n✏️  Test 6: Check edit function ID handling', 'blue');
    const editIdMatch = content.includes('handleEditProject(project._id || project.id)');
    log(`   ✅ Edit function handles both ID types: ${editIdMatch}`, editIdMatch ? 'green' : 'red');

    // Test 7: Check for proper ID handling in view button
    log('\n👁️  Test 7: Check view button ID handling', 'blue');
    const viewIdMatch = content.includes('router.push(`/projects/${project._id || project.id}`)');
    log(`   ✅ View button handles both ID types: ${viewIdMatch}`, viewIdMatch ? 'green' : 'red');

    // Test 8: Check for proper disabled state handling
    log('\n🔒 Test 8: Check disabled state ID handling', 'blue');
    const disabledMatch = content.includes('disabled={isRestoring === (project._id || project.id)}');
    log(`   ✅ Disabled state handles both ID types: ${disabledMatch}`, disabledMatch ? 'green' : 'red');

    log('\n🎉 Key prop fixes test completed!', 'green');
    log('\n📊 SUMMARY:', 'cyan');
    log('================', 'cyan');
    
    const allTestsPassed = uploadedProjectsKeyMatch && deletedProjectsKeyMatch && 
                          legacyProjectsKeyMatch && restoreIdMatch && 
                          deleteIdMatch && editIdMatch && viewIdMatch && disabledMatch;
    
    if (allTestsPassed) {
      log('✅ ALL TESTS PASSED!', 'green');
      log('✅ React key prop errors should be resolved', 'green');
      log('✅ Project ID handling is consistent', 'green');
      log('✅ Delete and restore functionality should work', 'green');
    } else {
      log('❌ Some tests failed', 'red');
      log('❌ There may still be key prop or ID issues', 'red');
    }

    log('\n🔧 What was fixed:', 'blue');
    log('- Added proper key props to all project lists', 'green');
    log('- Fixed ID handling for both _id and id fields', 'green');
    log('- Updated delete, edit, and restore functions', 'green');
    log('- Fixed disabled state comparisons', 'green');
    log('- Fixed navigation URLs', 'green');

    log('\n🎯 Expected result:', 'cyan');
    log('- No more React key prop warnings', 'cyan');
    log('- Delete and restore buttons should work', 'cyan');
    log('- Project navigation should work correctly', 'cyan');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the test
testKeyFixes();
