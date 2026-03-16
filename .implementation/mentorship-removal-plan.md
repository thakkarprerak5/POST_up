# Multi-Option Mentorship Removal System - Implementation Plan

## Overview
Comprehensive upgrade to the mentorship removal flow with three removal options, proper data tracking, and admin reassignment workflow.

## Components Status

### ✅ Already Implemented
1. **MentorRemovalModal** - Complete with 3 options (project_completed, report_issue, other)
2. **Assignment Requests Page** - Has "Removed" tab infrastructure
3. **Basic Removal Logic** - In AssignedStudents.tsx (needs upgrade)

### ⚠️ Needs Creation
1. **RemovedStudentCard** - Card component for displaying removed students in admin panel
2. **API Endpoints** - For removal and fetching removed students

### 🔧 Needs Update
1. **AssignedStudents.tsx** - Integrate MentorRemovalModal
2. **mentor-profile.tsx** - Add removal functionality for profile view
3. **Admin/Super-Admin Profile** - Already matches Mentor profile layout ✅

## Implementation Steps

### Step 1: Create RemovedStudentCard Component
- Display student/group information
- Show previous mentor details
- Show removal reason and details
- Action buttons for reassignment
- Handle all 3 removal types differently

### Step 2: Update AssignedStudents Component
- Replace simple confirm() with MentorRemovalModal
- Pass correct parameters to modal
- Handle all 3 removal types in API call
- Refresh data after removal

### Step 3: Create API Endpoint `/api/mentor/remove-assignment`
- Accept: assignmentId, removalReason, removalDetails
- Handle Individual Students and Groups
- Handle Invites vs Super Admin Assignments
- Update status based on removal reason:
  - `project_completed` → Status: completed (not in removed queue)
  - `report_issue` → Create report, Status: under_review
  - `other` → Status: removed (goes to admin queue)

### Step 4: Create API Endpoint `/api/admin/removed-students`
- Fetch all removed assignments
- Include previous mentor info
- Include removal reason and details
- Support for both students and groups

### Step 5: Update mentor-profile.tsx
- Add remove buttons for assigned students/groups
- Integrate MentorRemovalModal
- Handle removal logic

### Step 6: Fix "Object as React Child" Errors
- Audit all components
- Use defensive coding: `item?.name ?? 'N/A'`
- Ensure we only render strings/numbers, never objects

## Data Model

### Mentorship Assignment Collection Update
```typescript
{
  _id: ObjectId,
  mentorId: ObjectId, assignedToType: 'student' | 'group',
  studentId?: ObjectId,
  groupId?: ObjectId,
  projectId?: ObjectId,
  status: 'active' | 'completed' | 'removed' | 'under_review',
  assignedBy: ObjectId,
  assignedAt: Date,
  
  // Removal tracking
  removalReason?: 'project_completed' | 'report_issue' | 'other',
  removalDetails?: string,
  removedBy?: ObjectId,
  removedAt?: Date,
  reportId?: ObjectId, // If report_issue
  
  // For reassignment tracking
  previousMentorId?: ObjectId,
  reassignedAt?: Date
}
```

## Files to Create/Update

### Create:
1. `components/admin/RemovedStudentCard.tsx`
2. `app/api/mentor/remove-assignment/route.ts`
3. `app/api/admin/removed-students/route.ts`

### Update:
1. `components/mentor/AssignedStudents.tsx`
2. `components/mentor-profile.tsx` (already partially fixed)
3. `app/admin/assignment-requests/page.tsx` (already has tab)

## Testing Checklist
- [ ] Individual student removal (all 3 options)
- [ ] Group removal (all 3 options)
- [ ] Invite-based mentorship removal
- [ ] Super Admin assigned mentorship removal
- [ ] Admin can see removed students in queue
- [ ] Previous mentor info displays correctly
- [ ] Removal reason displays correctly
- [ ] No "Object as React child" errors
