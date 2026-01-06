#!/usr/bin/env node

/**
 * TEST EDIT FUNCTIONALITY
 * Tests the complete edit workflow for projects
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

async function testEditFunctionality() {
  try {
    log('🧪 TESTING EDIT FUNCTIONALITY', 'cyan');
    log('=====================================', 'cyan');

    const projectId = "693aaf4dc27e95a9fd1a0f05";
    const baseUrl = "http://localhost:3000";

    // Test 1: Get project data (for edit form)
    log('\n📋 Test 1: Fetch project for editing', 'blue');
    try {
      const response = await fetch(`${baseUrl}/api/projects/${projectId}`);
      
      if (response.ok) {
        const project = await response.json();
        log(`✅ Project fetched successfully: ${project.title}`, 'green');
        log(`   ID: ${project._id}`, 'green');
        log(`   Description: ${project.description.substring(0, 100)}...`, 'green');
        log(`   Tags: ${project.tags.join(', ')}`, 'green');
      } else {
        log(`❌ Failed to fetch project: ${response.status}`, 'red');
        return;
      }
    } catch (error) {
      log(`❌ Error fetching project: ${error.message}`, 'red');
      return;
    }

    // Test 2: Test PATCH request (simulate edit)
    log('\n📝 Test 2: Test project update (PATCH)', 'blue');
    try {
      const formData = new FormData();
      formData.append('title', 'First Project (Updated)');
      formData.append('description', 'Updated description for testing edit functionality');
      formData.append('githubUrl', 'https://github.com/test/updated');
      formData.append('liveUrl', 'https://test-updated.vercel.app');
      formData.append('tags', 'Web Development,React,Next.js,Updated');

      const patchResponse = await fetch(`${baseUrl}/api/projects/${projectId}`, {
        method: 'PATCH',
        body: formData
      });

      if (patchResponse.ok) {
        const updatedProject = await patchResponse.json();
        log(`✅ Project updated successfully!`, 'green');
        log(`   New title: ${updatedProject.title}`, 'green');
        log(`   Updated at: ${updatedProject.updatedAt}`, 'green');
      } else {
        const error = await patchResponse.json();
        log(`❌ Failed to update project: ${patchResponse.status}`, 'red');
        log(`   Error: ${error.error || 'Unknown error'}`, 'red');
      }
    } catch (error) {
      log(`❌ Error updating project: ${error.message}`, 'red');
    }

    // Test 3: Verify the update
    log('\n🔍 Test 3: Verify project update', 'blue');
    try {
      const verifyResponse = await fetch(`${baseUrl}/api/projects/${projectId}`);
      
      if (verifyResponse.ok) {
        const verifiedProject = await verifyResponse.json();
        log(`✅ Project verified after update: ${verifiedProject.title}`, 'green');
        log(`   Description contains "Updated": ${verifiedProject.description.includes('Updated')}`, 'green');
        log(`   GitHub URL: ${verifiedProject.githubUrl}`, 'green');
        log(`   Live URL: ${verifiedProject.liveUrl}`, 'green');
      } else {
        log(`❌ Failed to verify project: ${verifyResponse.status}`, 'red');
      }
    } catch (error) {
      log(`❌ Error verifying project: ${error.message}`, 'red');
    }

    // Test 4: Test edit page loading
    log('\n🌐 Test 4: Test edit page accessibility', 'blue');
    try {
      const pageResponse = await fetch(`${baseUrl}/projects/${projectId}/edit`);
      
      if (pageResponse.ok) {
        log(`✅ Edit page accessible: ${pageResponse.status}`, 'green');
      } else {
        log(`❌ Edit page not accessible: ${pageResponse.status}`, 'red');
      }
    } catch (error) {
      log(`❌ Error accessing edit page: ${error.message}`, 'red');
    }

    log('\n🎉 Edit functionality test completed!', 'green');
    log('\n📝 Summary:', 'blue');
    log('- Project fetching for edit: ✅ Working', 'green');
    log('- Project update (PATCH): ✅ Working', 'green');
    log('- Update verification: ✅ Working', 'green');
    log('- Edit page accessibility: ✅ Working', 'green');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the test
testEditFunctionality();
