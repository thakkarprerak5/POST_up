# Manual Repair Instructions for 3 Broken Group Requests

## 🚨 CRITICAL DATA INTEGRITY ISSUES

**3 Broken Group Requests Found:**
1. Request ID: `697706a9ab34cf7bdce74851` - Project: 'scac'
2. Request ID: `6973352fd0bd6747551a1c8d` - Project: 'fewe'  
3. Request ID: `6972037c6967adfa0f617b5b` - Project: 'fewe'

**Error:** `CRITICAL: Group request missing groupId - Data integrity violation`

---

## 🔧 IMMEDIATE REPAIR STEPS

### Step 1: Access MongoDB Database
```bash
# Connect to your MongoDB instance
mongosh "mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority"
```

### Step 2: Run Repair Script in MongoDB Shell
Copy and paste this script into your MongoDB shell:

```javascript
// Switch to the correct database
use postup;

// The 3 broken request IDs
const brokenRequestIds = [
  '697706a9ab34cf7bdce74851', // Project: 'scac'
  '6973352fd0bd6747551a1c8d', // Project: 'fewe' 
  '6972037c6967adfa0f617b5b'  // Project: 'fewe'
];

console.log('🔧 Starting repair of 3 broken group requests...');

let repairedCount = 0;

for (const requestId of brokenRequestIds) {
  console.log(`\n🔧 Repairing Request: ${requestId}`);
  
  try {
    // Get the broken request
    const request = db.adminassignmentrequests.findOne({ _id: ObjectId(requestId) });
    if (!request) {
      console.log(`   ❌ Request not found`);
      continue;
    }

    console.log(`   📋 Project: ${request.projectTitle}`);
    console.log(`   📋 Project ID: ${request.projectId}`);

    // Get the project to recover groupId
    const project = db.projects.findOne({ _id: ObjectId(request.projectId) });
    if (!project) {
      console.log(`   ❌ Project not found - cannot recover`);
      continue;
    }

    console.log(`   📋 Project found: ${project.title}`);
    console.log(`   📋 Project groupId: ${project.groupId || 'MISSING'}`);
    console.log(`   📋 Project registrationType: ${project.registrationType}`);

    let groupId = null;
    let groupName = '';

    if (project.groupId) {
      // Try to use existing groupId from project
      const existingGroup = db.groups.findOne({ _id: ObjectId(project.groupId) });
      if (existingGroup) {
        groupId = project.groupId.toString();
        groupName = existingGroup.name;
        console.log(`   ✅ Using existing group: ${groupName}`);
      } else {
        console.log(`   ⚠️ Project groupId exists but Group document missing`);
      }
    }

    if (!groupId) {
      // Create a new group from project data
      console.log(`   🏢 Creating new group from project data...`);
      
      let studentIds = [];
      groupName = `Group for ${project.title}`;

      // Extract student IDs from project data
      if (project.group && project.group.members) {
        studentIds = project.group.members
          .filter(member => member.userId)
          .map(member => member.userId);
        if (project.group.name) {
          groupName = project.group.name;
        }
      } else if (project.members && Array.isArray(project.members)) {
        studentIds = project.members.filter(id => id).map(id => id.toString());
      }

      // Include project author
      if (project.authorId && !studentIds.includes(project.authorId.toString())) {
        studentIds.push(project.authorId.toString());
      }

      console.log(`   👥 Found ${studentIds.length} student IDs`);

      // Create the group
      const groupResult = db.groups.insertOne({
        name: groupName,
        description: `Group for project: ${project.title}`,
        studentIds: studentIds,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      groupId = groupResult.insertedId.toString();
      
      console.log(`   ✅ Created group: ${groupName} (${studentIds.length} members)`);

      // Update project with new groupId
      db.projects.updateOne(
        { _id: ObjectId(request.projectId) },
        { $set: { groupId: groupId } }
      );
      
      console.log(`   ✅ Updated project with groupId`);
    }

    // Update the request with the groupId
    db.adminassignmentrequests.updateOne(
      { _id: ObjectId(requestId) },
      { $set: { groupId: groupId } }
    );

    console.log(`   ✅ Updated request with groupId: ${groupId}`);
    repairedCount++;

  } catch (repairError) {
    console.log(`   ❌ Repair failed: ${repairError.message}`);
  }
}

console.log('\n🔍 FINAL VALIDATION');
console.log('==================\n');

// Validate the repairs
for (const requestId of brokenRequestIds) {
  const request = db.adminassignmentrequests.findOne({ _id: ObjectId(requestId) });
  if (request && request.groupId) {
    const group = db.groups.findOne({ _id: ObjectId(request.groupId) });
    if (group) {
      console.log(`✅ Request ${requestId}: FIXED`);
      console.log(`   📋 Project: ${request.projectTitle}`);
      console.log(`   🏢 Group: ${group.name} (${group.studentIds?.length || 0} members)`);
    } else {
      console.log(`❌ Request ${requestId}: STILL BROKEN (Group not found)`);
    }
  } else {
    console.log(`❌ Request ${requestId}: STILL BROKEN (No groupId)`);
  }
}

console.log('\n📊 REPAIR SUMMARY');
console.log('==================');
console.log(`✅ Repaired: ${repairedCount}`);
console.log(`❌ Failed: ${brokenRequestIds.length - repairedCount}`);
console.log(`📋 Total processed: ${brokenRequestIds.length}`);

if (repairedCount === brokenRequestIds.length) {
  console.log('\n🎉 ALL BROKEN REQUESTS SUCCESSFULLY REPAIRED!');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Refresh the Admin Assignment Requests page');
  console.log('2. The 3 broken requests should now show proper group data');
  console.log('3. "Group Reference Missing" errors should be resolved');
} else {
  console.log(`\n⚠️ ${brokenRequestIds.length - repairedCount} requests still need manual attention`);
}
```

### Step 3: Verify Results
After running the script, you should see output like:
```
✅ Request 697706a9ab34cf7bdce74851: FIXED
   📋 Project: scac
   🏢 Group: Group for scac (2 members)

✅ Request 6973352fd0bd6747551a1c8d: FIXED
   📋 Project: fewe
   🏢 Group: Group for fewe (2 members)

✅ Request 6972037c6967adfa0f617b5b: FIXED
   📋 Project: fewe
   🏢 Group: Group for fewe (2 members)

🎉 ALL BROKEN REQUESTS SUCCESSFULLY REPAIRED!
```

---

## 🎯 EXPECTED RESULTS AFTER REPAIR

### Before Repair:
- ❌ "Group Reference Missing"
- ❌ "No group lead"
- ❌ "Empty members"
- ❌ "CRITICAL: Group request missing groupId"

### After Repair:
- ✅ Group name displays correctly
- ✅ Group lead shows with avatar and contact info
- ✅ Group members list with "Lead" badges
- ✅ Mentor assignment button works
- ✅ No more data integrity errors

---

## 🚀 ALTERNATIVE: One-Line Quick Fix

If you want a faster approach, you can run this one-liner for each broken request:

```javascript
// For each broken request, run this in MongoDB shell:
db.adminassignmentrequests.updateOne(
  { _id: ObjectId("697706a9ab34cf7bdce74851") },
  { $set: { groupId: "REPLACE_WITH_VALID_GROUP_ID" } }
);
```

But you'll need to find valid Group IDs first with:
```javascript
db.groups.find().limit(5);
```

---

## 📞 SUPPORT

If you encounter any issues during the repair:

1. **Check if projects exist:**
   ```javascript
   db.projects.find({ _id: ObjectId("697706a9ab34cf7bdce74851") });
   ```

2. **Check if groups exist:**
   ```javascript
   db.groups.find().limit(10);
   ```

3. **Verify request updates:**
   ```javascript
   db.adminassignmentrequests.find({ _id: ObjectId("697706a9ab34cf7bdce74851") });
   ```

The comprehensive script above should handle all edge cases and create missing groups automatically.
