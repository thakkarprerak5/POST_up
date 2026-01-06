const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority').then(async () => {
  const db = mongoose.connection.db;
  
  // Test the exact same query as in the function
  const messageData = {
    id: 'test_msg_123',
    senderId: '695b4c8652d1516d8e2cf856',
    senderName: 'Admin User',
    senderAvatar: '/placeholder-user.jpg',
    content: 'Test message',
    timestamp: new Date()
  };
  
  console.log('Testing addMessageToChat...');
  
  const result = await db.collection('chats').findOneAndUpdate(
    { id: 'chat_1767593087192_a7pgpnkp5' },
    { 
      $push: { messages: messageData },
      $set: { 
        lastMessage: messageData.content,
        lastMessageTime: messageData.timestamp,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  
  console.log('Result:', result);
  console.log('Success:', !!result);
  
  mongoose.connection.close();
}).catch(console.error);
