# 🔧 Saved Posts Debugging Guide

## 🎯 **Issue: Saved posts not showing in profile**

I've added comprehensive debugging to help identify the issue. Here's what to check:

## 🔍 **Debugging Steps**

### **1. Test the Save Functionality**
1. Go to any project post in the feed
2. Click the three-dot menu (⋮)
3. Click "Save Post"
4. Check browser console for these logs:
   ```
   🔍 Save toggle clicked for project: [project-id]
   📤 Sending save request...
   📊 Save response status: 200
   📊 Save response data: { success: true, isSaved: true, message: "Post saved to your profile" }
   ✅ Save successful: Post saved to your profile
   ```

### **2. Check the Profile Page**
1. Go to your profile page
2. Click on the "Saved" tab
3. Check browser console for these logs:
   ```
   🔍 Fetching saved posts...
   📊 Saved posts response status: 200
   📊 Saved posts data: { success: true, projects: [...], pagination: {...} }
   ```

### **3. Check Server Logs**
Check the server terminal for these logs:
```
🔍 Saved posts API called
📊 Session: Found
👤 Current user: Found
📊 Fetching saved posts for user: [user-id]
📊 Found saved posts: [number]
📊 Total saved posts: [number]
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Authentication Error**
**Symptoms**: 401 status, "Authentication required"
**Solution**: Make sure you're logged in and the session is valid

### **Issue 2: No Projects in Database**
**Symptoms**: "Found saved posts: 0"
**Solution**: The save request might not be reaching the database

### **Issue 3: Project Not Found**
**Symptoms**: Saved posts exist but projects array is empty
**Solution**: The project might have been deleted or the reference is broken

### **Issue 4: Frontend Not Updating**
**Symptoms**: API returns data but UI doesn't update
**Solution**: Check React Query cache and try refreshing the page

## 🛠️ **Manual Database Check**

If the above doesn't work, check the database directly:

```javascript
// Connect to MongoDB and check saved posts
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

async function checkSavedPosts() {
  await client.connect();
  const db = client.db('post-up');
  
  // Check saved posts collection
  const savedPosts = await db.collection('savedposts').find({}).toArray();
  console.log('Saved posts:', savedPosts);
  
  await client.close();
}

checkSavedPosts();
```

## 🎯 **Expected Behavior**

### **When Working Correctly:**
1. User clicks "Save Post" → Toast appears
2. Post appears in "Saved" tab on profile
3. Badge counter updates automatically
4. Post shows save date and engagement metrics

### **What to Look For:**
- ✅ Toast notification: "Post saved to your profile"
- ✅ Console logs showing successful save
- ✅ Server logs showing database operations
- ✅ Profile tab showing saved posts

## 📞 **Next Steps**

1. **Test the save functionality** and check console logs
2. **Check the profile page** and verify saved posts appear
3. **Look at server logs** for any database issues
4. **Report back** with the console output if issues persist

The debugging logs will help identify exactly where the issue is occurring in the save/display pipeline.
