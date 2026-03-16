// Test chat deletion functionality

async function testChatDeletion() {
  try {
    console.log('Testing chat deletion...');
    
    // First, get all chats to find one to delete
    const chatResponse = await fetch('http://localhost:3000/api/chat');
    const chatData = await chatResponse.json();
    
    console.log('Available chats:', chatData.chats?.length || 0);
    
    if (chatData.chats && chatData.chats.length > 0) {
      const chatToDelete = chatData.chats[0];
      console.log('Attempting to delete chat:', chatToDelete.id);
      
      // Delete the chat
      const deleteResponse = await fetch(`http://localhost:3000/api/chat/${chatToDelete.id}`, {
        method: 'DELETE'
      });
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response ok:', deleteResponse.ok);
      
      const deleteResult = await deleteResponse.text();
      console.log('Delete response body:', deleteResult);
      
      if (deleteResponse.ok) {
        console.log('✅ Chat deletion successful!');
      } else {
        console.log('❌ Chat deletion failed:', deleteResult);
      }
    } else {
      console.log('No chats available to test deletion');
    }
    
  } catch (error) {
    console.error('Error testing chat deletion:', error);
  }
}

testChatDeletion();
