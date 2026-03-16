# Database Fix: Corrupt Project Author References

## Problem

Some projects in the database have corrupt `author` fields - instead of being ObjectId references to users, they're embedded user objects without `_id` fields. This causes authorization checks to fail.

## Solution

Run the database fix script to convert all embedded author objects to proper ObjectId references.

## Steps

### 1. Check Your MongoDB Connection String

Make sure your `.env` or `.env.local` file has the correct MongoDB URI:

```env
MONGODB_URI=mongodb+srv://your-connection-string
```

### 2. Run the Fix Script

Open a **new terminal** (keep the dev server running) and run:

```bash
node scripts/fix-project-authors.js
```

### 3. Confirm the Changes

The script will:
- Show you all projects found
- Attempt to match embedded author objects with real users (by email or name)
- Update the database with proper ObjectId references
- Show a summary of what was fixed

### 4. Example Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 5 total projects

🔧 Fixing project: ML Research Project
   Current author: { name: 'thakkar prerak', photo: '...', id: 'no-id' }
   Searching by name: thakkar prerak
   ✅ Found user by name: 693288a714308dec3bb058bb
   ✅ Fixed! Updated author to ObjectId reference

📊 Summary:
   ✅ Already correct: 2
   🔧 Fixed: 3
   ❌ Couldn't fix: 0
   📁 Total: 5
```

### 5. Test Deletion Again

After running the script:
1. Refresh your browser
2. Try deleting a project
3. It should work! ✅

## Alternative: Manual Fix (No Script)

If you prefer not to run the script, you can manually update projects in MongoDB Compass or mongosh:

```javascript
// Find projects with embedded authors
db.projects.find({ "author.email": { $exists: true } })

// For each project, find the user and update:
const user = db.users.findOne({ email: "thakkarprerak@gmail.com" });
db.projects.updateOne(
  { _id: ObjectId("69745dc3af3303aaeb48ec40") },
  { $set: { author: user._id } }
);
```

## Why This Happened

Projects were likely created with code like:
```javascript
// WRONG - embeds entire user object
const project = new Project({
  title: "...",
  author: user  // ← This embeds the whole user object
});

// CORRECT - stores only the reference
const project = new Project({
  title: "...",
  author: user._id  // ← This stores just the ObjectId
});
```

## Prevention

Make sure your project creation code uses `user._id` not just `user`:

```typescript
// File: app/api/projects/create/route.ts
const newProject = new Project({
  title,
  description,
  author: user._id,  // ← Use _id, not the whole user object
  // ...
});
```
