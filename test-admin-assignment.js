// Test script to verify admin assignment processing
// This script tests the admin assignment flow by:
// 1. Creating a test assignment request
// 2. Processing it via the admin process-assignments API
// 3. Verifying the results

const testAdminAssignmentFlow = async () => {
  console.log('🧪 Testing admin assignment flow...');
  
  try {
    // Step 1: Create a test assignment request
    console.log('📝 Step 1: Creating test assignment request...');
    const createResponse = await fetch('http://localhost:3000/api/admin/assignment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer super-admin-token'
      },
      body: JSON.stringify({
        projectId: 'test-project-123',
        projectTitle: 'Test Project for Admin Assignment',
        projectDescription: 'This is a test project to verify admin assignment processing',
        requestedBy: 'test-admin-user-id',
        requestedToType: 'student',
        studentId: 'test-student-id',
        message: 'This is a test assignment request for admin processing'
      })
    });

    if (!createResponse.ok) {
      console.error('❌ Failed to create test assignment request:', createResponse.status, createResponse.statusText);
      return;
    }

    const createdRequest = await createResponse.json();
    console.log('✅ Step 1: Test assignment request created:', createdRequest);

    // Step 2: Process the assignment request
    console.log('📝 Step 2: Processing test assignment request...');
    const processResponse = await fetch('http://localhost:3000/api/admin/process-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer super-admin-token'
      },
      body: JSON.stringify({
        requestId: createdRequest._id,
        action: 'assign',
        mentorId: 'test-mentor-id',
        studentId: 'test-student-id'
      })
    });

    if (!processResponse.ok) {
      console.error('❌ Failed to process test assignment request:', processResponse.status, processResponse.statusText);
      return;
    }

    const processedRequest = await processResponse.json();
    console.log('✅ Step 2: Test assignment request processed:', processedRequest);

    // Step 3: Verify the results
    if (processedRequest.success && processedRequest.assignedMentorId === 'test-mentor-id') {
      console.log('✅ Step 3: Test assignment request assigned successfully!');
      console.log('   - Assigned Mentor:', processedRequest.assignedMentorId);
      console.log('   - Student ID:', processedRequest.studentId);
      console.log('   - Assigned By:', processedRequest.assignedBy);
    } else {
      console.log('❌ Step 3: Test assignment request was not assigned');
    }
  } catch (error) {
    console.error('❌ Error in test flow:', error);
  }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Run the test
testAdminAssignmentFlow();
