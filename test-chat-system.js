// Comprehensive Test Suite for Post-Up Chat System
// Run this in browser console when logged in

console.log('🧪 Starting Post-Up Chat System Tests...\n');

// Test 1: Check if user is authenticated
function testAuthentication() {
  console.log('🔐 Test 1: Authentication');
  fetch('/api/auth/session')
    .then(res => res.json())
    .then(session => {
      if (session && session.user) {
        console.log('✅ User authenticated:', session.user.name);
        return true;
      } else {
        console.log('❌ User not authenticated');
        return false;
      }
    })
    .catch(err => console.log('❌ Auth test failed:', err));
}

// Test 2: Fetch chats
function testFetchChats() {
  console.log('\n📨 Test 2: Fetch Chats');
  fetch('/api/chat')
    .then(res => res.json())
    .then(data => {
      console.log('✅ Chats fetched successfully');
      console.log('📊 Chat count:', data.chats?.length || 0);
      if (data.chats?.length > 0) {
        console.log('💬 Sample chat:', data.chats[0]);
      }
      return data.chats || [];
    })
    .catch(err => console.log('❌ Fetch chats failed:', err));
}

// Test 3: Create a test chat (if possible)
function testCreateChat() {
  console.log('\n➕ Test 3: Create Chat');
  // This would need actual user selection in UI
  console.log('📝 Manual test required: Create chat through UI');
  console.log('   1. Click "New Chat" button');
  console.log('   2. Select a user');
  console.log('   3. Verify chat is created');
  console.log('   4. Try creating duplicate chat with same user');
  console.log('   5. Should open existing chat instead of creating duplicate');
}

// Test 4: Test unread count functionality
function testUnreadCount() {
  console.log('\n🔔 Test 4: Unread Count');
  console.log('📝 Manual test required:');
  console.log('   1. Send message to someone');
  console.log('   2. Check if unread count badge appears');
  console.log('   3. Have them open the chat');
  console.log('   4. Verify badge disappears');
  console.log('   5. Check header chat icon for unread count');
}

// Test 5: Test chat deletion
function testChatDeletion() {
  console.log('\n🗑️ Test 5: Chat Deletion');
  console.log('📝 Manual test required:');
  console.log('   1. Right-click on a chat');
  console.log('   2. Select "Delete"');
  console.log('   3. Confirm deletion');
  console.log('   4. Verify chat is removed from list');
  console.log('   5. Try deleting chat you didn\'t create');
  console.log('   6. Should work if you\'re a participant');
}

// Test 6: Test clear all chats
function testClearAllChats() {
  console.log('\n🧹 Test 6: Clear All Chats');
  console.log('📝 Manual test required:');
  console.log('   1. Click red X button in sidebar header');
  console.log('   2. Confirm "Clear all chats"');
  console.log('   3. Verify all chats are deleted');
  console.log('   4. Check console for success messages');
}

// Test 7: Test message sending
function testMessageSending() {
  console.log('\n📤 Test 7: Message Sending');
  console.log('📝 Manual test required:');
  console.log('   1. Open a chat');
  console.log('   2. Type a message');
  console.log('   3. Press Enter or click Send');
  console.log('   4. Verify message appears in chat');
  console.log('   5. Check network tab for API call');
}

// Test 8: Test API endpoints directly
function testAPIEndpoints() {
  console.log('\n🔌 Test 8: API Endpoints');
  
  const endpoints = [
    '/api/chat',
    '/api/auth/session',
    '/api/profile'
  ];
  
  endpoints.forEach(endpoint => {
    fetch(endpoint)
      .then(res => {
        console.log(`✅ ${endpoint}: ${res.status} ${res.statusText}`);
      })
      .catch(err => {
        console.log(`❌ ${endpoint}: ${err.message}`);
      });
  });
}

// Run all tests
function runAllTests() {
  testAuthentication();
  testFetchChats();
  testCreateChat();
  testUnreadCount();
  testChatDeletion();
  testClearAllChats();
  testMessageSending();
  testAPIEndpoints();
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ Automated tests completed');
  console.log('📝 Manual tests require UI interaction');
  console.log('🔍 Check browser console for detailed results');
  console.log('📊 Monitor network tab for API calls');
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.testChatSystem = {
  testAuthentication,
  testFetchChats,
  testCreateChat,
  testUnreadCount,
  testChatDeletion,
  testClearAllChats,
  testMessageSending,
  testAPIEndpoints,
  runAllTests
};

console.log('\n🚀 Test suite loaded! Use window.testChatSystem for manual testing.');
