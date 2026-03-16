# How Group Lead Detection Works

## 🎯 **Overview**
The system determines who is a **Group Lead** through a **database field** in the user's profile.

## 📊 **Data Flow**

### 1. **Database Storage**
```typescript
// User Model - Profile Interface
interface IProfile {
  // ... other fields
  isGroupLead?: boolean; // ← This field determines group lead status
}

// Database Schema
const profileSchema = new Schema<IProfile>({
  // ... other fields
  isGroupLead: { type: Boolean, default: false }, // ← Stored in MongoDB
});
```

### 2. **API Response**
When user logs in, the `/api/profile` endpoint returns:
```json
{
  "fullName": "Thakkar Bhavya",
  "email": "thakkarprerak5@gmail.com",
  "type": "student",
  "profile": {
    "isGroupLead": true, // ← Current user IS a group lead
    "course": "cse",
    "branch": "B.Tech"
  }
}
```

### 3. **Frontend Detection**
```typescript
// ProjectRegistrationModal.tsx
const isGroupLead = user?.profile?.isGroupLead;

// UI Logic based on this:
{!isGroupLead ? 'opacity-50 cursor-not-allowed' : ''}
onClick={() => isGroupLead && setRegistrationType('group')}
```

## 🔧 **How to Set Group Lead Status**

### **Method 1: Database Direct Update**
```javascript
// Update user to be group lead
await User.updateOne(
  { email: "user@example.com" },
  { $set: { 'profile.isGroupLead': true } }
);
```

### **Method 2: Through User Interface**
1. **Admin Panel**: Admin can set group lead status
2. **User Profile**: User can request group lead status
3. **Automatic**: Based on user role/semester

## 🎨 **Visual Indicators**

### **In Project Registration Modal:**
- **Group Lead**: ✅ Can click "Group" option
- **Not Group Lead**: ❌ Grayed out with message "(Requires Group Lead status)"

### **Text Display:**
```typescript
{isGroupLead ? '(Group Lead)' : '(Requires Group Lead status)'}
```

## 🏗️ **Current Implementation**

### **Your Current Status:**
```json
{
  "fullName": "Thakkar Bhavya",
  "email": "thakkarprerak5@gmail.com", 
  "profile": {
    "isGroupLead": true // ← You are a group lead
  }
}
```

### **How You Got Group Lead Status:**
1. **Added `isGroupLead` field** to User model
2. **Updated your profile** via API call: `/api/debug/make-group-lead`
3. **Database now stores** `isGroupLead: true` for your account

## 🔍 **Verification**

### **Check Your Status:**
```javascript
// In browser console
fetch('/api/profile')
  .then(res => res.json())
  .then(user => console.log('Group Lead:', user.profile?.isGroupLead));
```

### **Admin Can View/Manage:**
```typescript
// Admin endpoint to manage group leads
GET /api/admin/users?filter=group-leads
POST /api/admin/users/{id}/make-group-lead
```

## 🚀 **Business Logic**

### **Why Group Leads?**
- **Project Management**: Group leads can submit group projects
- **Responsibility**: They manage team members and project coordination
- **Authority**: Only group leads can register group projects

### **Security:**
- **Database-driven**: Cannot be faked in frontend
- **Role-based**: Controlled through user permissions
- **Admin-managed**: Only admins can change group lead status

---

**Summary**: Group lead status is determined by the `isGroupLead` boolean field in the user's profile document in MongoDB, which is checked by the frontend to enable/disable group project registration.
