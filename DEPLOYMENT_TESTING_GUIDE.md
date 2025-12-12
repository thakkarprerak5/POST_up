# Deployment & Testing Guide

## Pre-Deployment Checklist

### 1. Database Migration (Critical)
Run these commands in your MongoDB Atlas or local MongoDB shell:

```javascript
// Add interaction fields to existing projects
db.projects.updateMany(
  {},
  {
    $set: {
      likes: [],
      likeCount: 0,
      comments: [],
      shares: [],
      shareCount: 0
    }
  }
);

// Add follower fields to existing users
db.users.updateMany(
  {},
  {
    $set: {
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0
    }
  }
);
```

### 2. Environment Setup
Ensure `.env.local` contains:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000 (dev) or https://yourdomain.com (prod)
```

### 3. Build Verification
```bash
npm run build
# Should complete with no TypeScript errors
```

## Testing Workflows

### Test 1: Like/Unlike a Project
1. Navigate to `/projects/[some-project-id]`
2. Click heart icon to like project
3. Verify count increases by 1
4. Click again to unlike
5. Verify count decreases by 1
6. Refresh page - like state persists

### Test 2: Comment on Project
1. Navigate to `/projects/[some-project-id]`
2. Scroll to comments section
3. (If not logged in) See "Sign in to comment" link
4. (If logged in) Enter comment text
5. Click "Post Comment"
6. Verify comment appears in list with:
   - User avatar (or initial if no avatar)
   - User name
   - Timestamp
   - Comment text
7. Verify comment count updates
8. Refresh page - comment persists

### Test 3: Delete Own Comment
1. Post a comment on your own project
2. Verify delete appears (comment author sees delete)
3. Click delete
4. Verify comment removed from list
5. Verify comment count decreases

### Test 4: Follow/Unfollow a Mentor
1. Navigate to `/mentors`
2. Click "Follow" on any mentor card
3. Verify:
   - Button changes to "Following" (secondary style)
   - Follower count increases
4. Click "Following" to unfollow
5. Verify:
   - Button changes back to "Follow"
   - Follower count decreases

### Test 5: Share a Project
1. Navigate to `/projects/[any-project-id]`
2. Click share icon in interactions
3. Verify:
   - Share count increases
   - Share icon highlights (blue)
4. Click again to unshare
5. Verify count decreases and icon returns to normal

### Test 6: Recent Activity Feed
1. Create/upload a new project
2. Navigate to home page
3. Scroll to "Recent Activity" section (if implemented)
4. Verify new project appears with:
   - User avatar
   - "Uploaded Project" badge
   - Project title
   - Timestamp

### Test 7: Authentication Required Features
1. Log out completely
2. Navigate to `/projects/[id]`
3. Scroll to comment section
4. Verify "Sign in" link appears
5. Click like button
6. Verify it requires auth (shows toast or redirects)
7. Log back in and repeat steps 2-5

### Test 8: Authorization - Comment Deletion
1. Create two user accounts (A and B)
2. User A creates a project and posts a comment
3. User B adds a comment to the same project
4. Login as User B
5. Verify only User B's delete button appears (not User A's)
6. Login as User A (project author)
7. Verify delete appears for both User B's and User A's comments

### Test 9: User Profile Integration
1. Navigate to `/mentors` or search results
2. Click on mentor name/avatar
3. Verify navigates to `/profile/[user-id]`
4. Verify profile shows:
   - User avatar
   - Name, bio, skills
   - Follower/following counts
   - (Future) User's uploaded projects

### Test 10: Search Results
1. Use search to find a user
2. Click on user in results
3. Verify navigates to user profile
4. Use search to find a project
5. Click on project in results
6. Verify navigates to `/projects/[id]`

## Performance Testing

### Check for N+1 Queries
```javascript
// Enable MongoDB query logging
db.setProfilingLevel(2);
db.system.profile.find().sort({ ts : -1 }).limit(5).pretty();
```

### Load Test Recent Activity Feed
- Verify endpoint returns within 500ms with 10k projects
- Check database indexes on createdAt field

### Cache Validation
- Like/unlike same project: should use API, not browser cache
- Follow/unfollow: counts update in real-time

## Rollback Plan

If critical issues found in production:

1. **Revert Database Changes**:
   ```javascript
   // Remove added fields (optional - they won't hurt)
   db.projects.updateMany({}, { $unset: { likes: "", likeCount: "", shares: "", shareCount: "", comments: "" } });
   db.users.updateMany({}, { $unset: { followers: "", following: "", followerCount: "", followingCount: "" } });
   ```

2. **Revert Code**:
   ```bash
   git revert [commit-hash]
   npm run build
   npm start
   ```

3. **Notify Users**: If user-facing features broken, notify via email/toast

## Production Deployment Steps

1. **Backup Database**:
   ```bash
   mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" --out ./backup
   ```

2. **Run Migration** (see above)

3. **Deploy Code**:
   ```bash
   git push origin main
   # CI/CD pipeline triggers build and deploy
   ```

4. **Verify Health**:
   - Check error logs
   - Run smoke tests (create like, add comment, follow)
   - Monitor API response times

5. **Enable Analytics** (if available):
   - Track interaction counts
   - Monitor comment/like creation rates

## Monitoring

### Key Metrics to Watch
- API endpoint response times (target: <500ms)
- Error rates on interaction endpoints (target: <0.1%)
- Database query performance
- User session count

### Logs to Check
- `/api/projects/[id]/like` - like/unlike activity
- `/api/projects/[id]/comments` - comment creation
- `/api/users/[id]/follow` - follow/unfollow activity

### Common Issues & Solutions

**Issue**: "Follow button shows wrong state after refresh"
- Solution: Ensure GET `/api/users/me` returns current following list

**Issue**: "Comment count doesn't match actual comments"
- Solution: Check database schema - comments array might be missing

**Issue**: "Hydration mismatch on follow buttons"
- Solution: Ensure follow state initializes from server-side data, not guessed

**Issue**: "Likes persist but not visible on refresh"
- Solution: Verify likes array is returned in GET `/api/projects/[id]`

## Rollout Strategy

### Phase 1 (10% Users):
- Deploy to 10% of user base
- Monitor error rates and performance
- Gather feedback on UI/UX

### Phase 2 (50% Users):
- Deploy to 50% of user base
- Run load tests during peak hours
- Check database performance

### Phase 3 (100% Users):
- Full rollout
- Keep rollback ready
- Monitor 24/7 for first week

