const mongoose = require('mongoose');
// require('dotenv').config({ path: '.env.local' });

// Define Notification Schema (simplified)
const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function checkNotifications() {
    try {
        // Try to load from env, fallback to hardcoded local if needed (for debugging)
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/post-up';

        console.log('🔌 Connecting to MongoDB...', uri.replace(/:([^:@]{1,20})@/, ':****@')); // Hide password

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ fullName: String, email: String }));
        const userCount = await User.countDocuments();
        console.log(`👤 Total Users: ${userCount}`);

        if (userCount > 0) {
            const firstUser = await User.findOne();
            console.log(`   Sample User ID: ${firstUser._id}`);
        }

        const count = await Notification.countDocuments();
        console.log(`📊 Total Notifications in DB: ${count}`);

        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);
        console.log('📝 Last 5 Notifications:');
        notifications.forEach(n => {
            console.log(`- [${n.type}] To: ${n.recipientId} | Read: ${n.isRead} | At: ${n.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkNotifications();
