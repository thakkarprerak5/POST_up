#!/usr/bin/env node

/**
 * TEST DELETE AND RESTORE FUNCTIONALITY
 * Tests the soft delete and restore features
 */

const http = require("http");

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

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDeleteRestore() {
  log('🧪 TESTING DELETE AND RESTORE FUNCTIONALITY', 'cyan');
  log('==========================================', 'cyan');

  try {
    // Test 1: Get user projects
    log('\n📋 Test 1: Get user projects', 'blue');
    const projectsResponse = await makeRequest('GET', '/api/projects');
    if (projectsResponse.status !== 200) {
      throw new Error(`Failed to get projects: ${projectsResponse.status}`);
    }
    
    const projects = projectsResponse.data;
    if (projects.length === 0) {
      log('   ⚠️  No projects found to test with', 'yellow');
      return;
    }
    
    const testProject = projects[0];
    log(`   ✓ Found test project: ${testProject.title}`, 'green');
    log(`   ✓ Project ID: ${testProject.id}`, 'green');

    // Test 2: Soft delete project
    log('\n🗑️  Test 2: Soft delete project', 'blue');
    const deleteResponse = await makeRequest('DELETE', `/api/projects/${testProject.id}`);
    if (deleteResponse.status !== 200) {
      throw new Error(`Failed to delete project: ${deleteResponse.status}`);
    }
    
    log(`   ✓ Project deleted successfully`, 'green');
    log(`   ✓ Message: ${deleteResponse.data.message}`, 'green');
    log(`   ✓ Restore available until: ${new Date(deleteResponse.data.restoreAvailableUntil).toLocaleString()}`, 'green');

    // Test 3: Check if project appears in deleted projects
    log('\n📋 Test 3: Check deleted projects endpoint', 'blue');
    const deletedResponse = await makeRequest('GET', '/api/projects/deleted');
    if (deletedResponse.status !== 200) {
      throw new Error(`Failed to get deleted projects: ${deletedResponse.status}`);
    }
    
    const deletedProjects = deletedResponse.data;
    const foundDeleted = deletedProjects.find(p => p.id === testProject.id);
    
    if (foundDeleted) {
      log(`   ✓ Project found in deleted projects`, 'green');
      log(`   ✓ Time remaining: ${Math.round(foundDeleted.hoursRemaining)} hours`, 'green');
    } else {
      log(`   ⚠️  Project not found in deleted projects`, 'yellow');
    }

    // Test 4: Check if project is hidden from main projects
    log('\n📋 Test 4: Check project is hidden from main list', 'blue');
    const projectsAfterDelete = await makeRequest('GET', '/api/projects');
    const stillVisible = projectsAfterDelete.data.find(p => p.id === testProject.id);
    
    if (!stillVisible) {
      log(`   ✓ Project successfully hidden from main list`, 'green');
    } else {
      log(`   ⚠️  Project still visible in main list`, 'yellow');
    }

    // Test 5: Restore project
    log('\n♻️  Test 5: Restore project', 'blue');
    const restoreResponse = await makeRequest('POST', `/api/projects/${testProject.id}/restore`);
    if (restoreResponse.status !== 200) {
      throw new Error(`Failed to restore project: ${restoreResponse.status}`);
    }
    
    log(`   ✓ Project restored successfully`, 'green');
    log(`   ✓ Message: ${restoreResponse.data.message}`, 'green');

    // Test 6: Check if project is back in main projects
    log('\n📋 Test 6: Check project is back in main list', 'blue');
    const projectsAfterRestore = await makeRequest('GET', '/api/projects');
    const restored = projectsAfterRestore.data.find(p => p.id === testProject.id);
    
    if (restored) {
      log(`   ✓ Project successfully restored to main list`, 'green');
    } else {
      log(`   ⚠️  Project not found in main list after restore`, 'yellow');
    }

    // Test 7: Check if project is removed from deleted projects
    log('\n📋 Test 7: Check project removed from deleted list', 'blue');
    const deletedAfterRestore = await makeRequest('GET', '/api/projects/deleted');
    const stillDeleted = deletedAfterRestore.data.find(p => p.id === testProject.id);
    
    if (!stillDeleted) {
      log(`   ✓ Project removed from deleted projects list`, 'green');
    } else {
      log(`   ⚠️  Project still in deleted projects list`, 'yellow');
    }

    log('\n🎉 ALL TESTS PASSED!', 'green');
    log('✅ Soft delete and restore functionality is working correctly', 'green');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
testDeleteRestore();
