// Debug script to check AdminAssignmentRequest creation and data integrity
const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUGGING ADMIN ASSIGNMENT REQUESTS');
console.log('=====================================\n');

// Step 1: Check the request creation code
console.log('📋 STEP 1: INSPECTING REQUEST CREATION CODE\n');

const projectRegPath = path.join(__dirname, 'app', 'api', 'project-registrations', 'route.ts');
if (fs.existsSync(projectRegPath)) {
  const content = fs.readFileSync(projectRegPath, 'utf8');
  
  console.log('🔍 Checking project-registrations route...');
  
  // Look for groupId assignment
  const groupIdMatch = content.match(/groupId:\s*([^,}]+)/g);
  if (groupIdMatch) {
    console.log('✅ Found groupId assignments:');
    groupIdMatch.forEach(match => console.log('  -', match));
  } else {
    console.log('❌ No groupId assignments found');
  }
  
  // Look for Group creation
  const groupCreationMatch = content.match(/new Group\(/g);
  if (groupCreationMatch) {
    console.log('✅ Found Group creation:', groupCreationMatch.length, 'times');
  } else {
    console.log('❌ No Group creation found');
  }
  
  // Look for registrationType === 'group' checks
  const groupTypeChecks = content.match(/registrationType === 'group'/g);
  if (groupTypeChecks) {
    console.log('✅ Found group type checks:', groupTypeChecks.length, 'times');
  } else {
    console.log('❌ No group type checks found');
  }
  
} else {
  console.log('❌ project-registrations route not found');
}

// Step 2: Check the AdminAssignmentRequest model
console.log('\n📋 STEP 2: INSPECTING ADMIN ASSIGNMENT REQUEST MODEL\n');

const modelPath = path.join(__dirname, 'models', 'AdminAssignmentRequest.ts');
if (fs.existsSync(modelPath)) {
  const modelContent = fs.readFileSync(modelPath, 'utf8');
  
  console.log('🔍 Checking AdminAssignmentRequest schema...');
  
  // Look for groupId field definition
  const groupIdFieldMatch = modelContent.match(/groupId:\s*{([^}]+)}/);
  if (groupIdFieldMatch) {
    console.log('✅ Found groupId field definition:');
    console.log('  -', groupIdFieldMatch[0]);
  } else {
    console.log('❌ No groupId field definition found');
  }
  
  // Look for required validation
  const requiredMatch = modelContent.match(/required:\s*(true|false)/g);
  if (requiredMatch) {
    console.log('✅ Found required validations:', requiredMatch);
  } else {
    console.log('❌ No required validations found');
  }
  
  // Look for createAdminAssignmentRequest function
  const createFunctionMatch = modelContent.match(/createAdminAssignmentRequest[^}]+}/s);
  if (createFunctionMatch) {
    console.log('✅ Found createAdminAssignmentRequest function');
    console.log('Function parameters:', createFunctionMatch[0].substring(0, 200) + '...');
  } else {
    console.log('❌ createAdminAssignmentRequest function not found');
  }
  
} else {
  console.log('❌ AdminAssignmentRequest model not found');
}

// Step 3: Check existing API routes for admin assignment requests
console.log('\n📋 STEP 3: INSPECTING API ROUTES\n');

const adminApiPath = path.join(__dirname, 'app', 'api', 'admin', 'assignment-requests', 'route.ts');
if (fs.existsSync(adminApiPath)) {
  const apiContent = fs.readFileSync(adminApiPath, 'utf8');
  
  console.log('🔍 Checking admin assignment requests API...');
  
  // Look for population logic
  const populateMatch = apiContent.match(/populate\([^)]+\)/g);
  if (populateMatch) {
    console.log('✅ Found population logic:');
    populateMatch.forEach(match => console.log('  -', match));
  } else {
    console.log('❌ No population logic found');
  }
  
  // Look for getAllAdminAssignmentRequests call
  const getAllMatch = apiContent.includes('getAllAdminAssignmentRequests');
  if (getAllMatch) {
    console.log('✅ Uses getAllAdminAssignmentRequests function');
  } else {
    console.log('❌ Does not use getAllAdminAssignmentRequests');
  }
  
} else {
  console.log('❌ Admin assignment requests API not found');
}

console.log('\n🎯 ANALYSIS COMPLETE');
console.log('==================\n');
console.log('📝 NEXT STEPS:');
console.log('1. Check if groupId is being set correctly in project registration');
console.log('2. Verify Group documents are created for group projects');
console.log('3. Ensure AdminAssignmentRequest schema validates groupId for group requests');
console.log('4. Check population logic in admin fetch API');
