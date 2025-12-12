# Quick Start Guide

## For Developers

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Database Migration** (Critical!)
   ```javascript
   // Connect to MongoDB and run:
   db.projects.updateMany({}, { $set: { likes: [], likeCount: 0, comments: [], shares: [], shareCount: 0 } });
   db.users.updateMany({}, { $set: { followers: [], following: [], followerCount: 0, followingCount: 0 } });
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   NEXTAUTH_SECRET=your_random_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

---

## For Users

### Features You Can Use Now

#### 1. Like Projects
- Go to any project detail page
- Click the heart icon
- Your like appears instantly
- Click again to unlike

#### 2. Comment on Projects
- Scroll to comments section
- Write your comment (if logged in)
- Click "Post Comment"
- See your comment appear with timestamp
- Delete your own comments

#### 3. Follow Mentors
- Go to `/mentors` page
- Click "Follow" on any mentor
- See follower count increase
- Click "Following" to unfollow

#### 4. View Project Details
- Click any project card
- See all interactions (likes, comments, shares)
- View project images, links, and description
- Add your comments and feedback

#### 5. Browse Mentors
- Navigate to `/mentors`
- See all available mentors
- View their bio, skills, and follower count
- Click to follow or view their profile

#### 6. Recent Activity
- Check home page for recent activity
- See who uploaded projects
- Click to view their profiles

---

## Quick API Tests

### Test Like Endpoint
```bash
curl -X POST http://localhost:3000/api/projects/[project-id]/like
```

### Test Add Comment
```bash
curl -X POST http://localhost:3000/api/projects/[project-id]/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "Nice work!"}'
```

### Test Follow User
```bash
curl -X POST http://localhost:3000/api/users/[user-id]/follow
```

### Get Current User
```bash
curl http://localhost:3000/api/users/me
```

### Get All Mentors
```bash
curl http://localhost:3000/api/mentors
```

---

## Troubleshooting

### "Hydration Error" on Chat Page
- This is fixed with `suppressHydrationWarning` on time elements
- Clear browser cache if persists

### "Cannot like/comment" - Unauthorized
- You need to be logged in
- Try logging in again
- Check browser cookies

### "Comment doesn't appear after posting"
- Check network tab for 201 status
- Verify comment text wasn't empty
- Refresh page to see if it loads

### "Follow button doesn't work"
- Must be logged in
- Can't follow yourself
- Check that user ID is correct

### Database Migration Failed
- Ensure you're connected to correct MongoDB instance
- Check connection string in `.env.local`
- Try running migration manually in MongoDB Atlas UI

---

## File Navigation

### Key Files to Know

**Frontend Components:**
- `/components/project-interactions.tsx` - Like/share/comment UI
- `/components/follow-button.tsx` - Follow button
- `/components/recent-activity-feed.tsx` - Activity timeline

**Pages:**
- `/app/projects/[id]/page.tsx` - Project detail view
- `/app/mentors/page.tsx` - Mentors discovery

**APIs:**
- `/app/api/projects/[id]/like/route.ts` - Like endpoint
- `/app/api/projects/[id]/comments/route.ts` - Comments endpoint
- `/app/api/users/[id]/follow/route.ts` - Follow endpoint
- `/app/api/mentors/route.ts` - Mentors list

**Documentation:**
- `API_REFERENCE.md` - Full API documentation
- `FEATURE_IMPLEMENTATION_SUMMARY.md` - What was built
- `DEPLOYMENT_TESTING_GUIDE.md` - Testing procedures

---

## Common Tasks

### Add Like Button to a Component
```tsx
import { ProjectInteractions } from '@/components/project-interactions';

<ProjectInteractions
  projectId={project._id}
  initialLikes={project.likeCount}
  initialComments={project.comments?.length || 0}
  initialShares={project.shareCount}
/>
```

### Add Follow Button to User Card
```tsx
import { FollowButton } from '@/components/follow-button';

<FollowButton 
  userId={user._id}
  userEmail={user.email}
/>
```

### Fetch User's Projects
```typescript
const response = await fetch(`/api/users/${userId}/projects`);
const projects = await response.json();
```

### Get Current User's Following List
```typescript
const response = await fetch('/api/users/me');
const user = await response.json();
console.log(user.following); // Array of user IDs
```

---

## Next Actions

### For Developers
1. [ ] Run database migration
2. [ ] Test all endpoints with curl or Postman
3. [ ] Review code in 6 provided API files
4. [ ] Check TypeScript compilation: `npm run build`
5. [ ] Manual testing of all workflows
6. [ ] Deploy to production

### For Designers/Product
1. [ ] Verify UI matches design system
2. [ ] Test on mobile/tablet
3. [ ] Review error messages
4. [ ] Check loading states
5. [ ] Get user feedback

### For QA/Testing
1. [ ] Run test scenarios from DEPLOYMENT_TESTING_GUIDE.md
2. [ ] Check edge cases (self-follow, delete non-existent comment)
3. [ ] Performance testing with many projects
4. [ ] Auth/permission testing
5. [ ] Create test case documentation

---

## Performance Tips

### For Better Load Times
- Comments list: Only load first 5, show "Load More"
- Activity feed: Implement pagination
- Mentor list: Consider caching if 100+ mentors
- Images: Use next/image with proper optimization

### For Better User Experience
- Show loading spinners while fetching
- Optimistic UI updates (show like before server confirms)
- Toast notifications for all actions
- Debounce rapid clicks (prevent double-liking)

---

## Deployment Checklist

- [ ] Database migrated
- [ ] Environment variables set
- [ ] Build completes successfully: `npm run build`
- [ ] Manual testing passed
- [ ] Error logging configured
- [ ] Analytics/monitoring set up
- [ ] Backup existing database
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

---

## Getting Help

### Documentation
- See `IMPLEMENTATION_GUIDE.md` for full overview
- See `API_REFERENCE.md` for endpoint details
- See `DEPLOYMENT_TESTING_GUIDE.md` for testing

### Debugging
- Check browser DevTools → Network tab
- Check server logs for errors
- Check MongoDB for data integrity
- Enable verbose logging if needed

### Common Questions

**Q: Why denormalize counts?**
A: For performance - no need to count arrays on every query

**Q: Can I like my own project?**
A: Yes, there's no restriction (could add if desired)

**Q: How are comments stored?**
A: In a nested array within the project document

**Q: Can I edit comments?**
A: Current implementation supports delete only (not edit)

**Q: Are there rate limits?**
A: No - consider adding if spam is an issue

---

## Version Info

- Next.js: 13+
- React: 18+
- TypeScript: 5+
- MongoDB: 4.4+
- NextAuth: 4.x

---

## Support

For issues or questions:
1. Check documentation files (see above)
2. Review code comments in implementation files
3. Check MongoDB schema in models/
4. Review error messages in browser/server logs
5. Create GitHub issue with reproduction steps

---

**Last Updated**: 2024
**Status**: ✅ Ready for Testing & Deployment

