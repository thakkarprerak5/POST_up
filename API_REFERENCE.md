# API Reference

## Authentication
All endpoints (except GET /api/mentors, /api/projects/[id], /api/users/[id]) require valid NextAuth session.

**Session Format:**
```typescript
{
  user: {
    email: string,
    name: string,
    id: string,
    role: string,
    image?: string
  },
  expires: string
}
```

## Projects API

### GET /api/projects/[id]
Retrieve a single project by ID.

**Parameters:**
- `id` (URL): Project ID (MongoDB ObjectId)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Project Title",
  "description": "Project description...",
  "author": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Author Name",
    "avatar": "https://..."
  },
  "tags": ["tag1", "tag2"],
  "images": ["https://...", "https://..."],
  "github": "https://github.com/...",
  "liveUrl": "https://...",
  "likes": ["507f1f77bcf86cd799439013", "..."],
  "likeCount": 5,
  "comments": [
    {
      "id": "1234567890",
      "userId": "507f1f77bcf86cd799439013",
      "userName": "John Doe",
      "userAvatar": "https://...",
      "text": "Great project!",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "shares": ["507f1f77bcf86cd799439014"],
  "shareCount": 2,
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- 200: Success
- 404: Project not found
- 500: Server error

---

### PATCH /api/projects/[id]
Update a project (author-only).

**Authentication:** Required (author only)

**Parameters:**
- `id` (URL): Project ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["new", "tags"],
  "github": "https://...",
  "liveUrl": "https://..."
}
```

**Response:** Updated project object (same as GET)

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 403: Not project author
- 404: Project not found
- 500: Server error

---

### DELETE /api/projects/[id]
Delete a project (author-only).

**Authentication:** Required (author only)

**Parameters:**
- `id` (URL): Project ID

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 403: Not project author
- 404: Project not found
- 500: Server error

---

### POST /api/projects/[id]/like
Toggle like on a project.

**Authentication:** Required

**Parameters:**
- `id` (URL): Project ID

**Request Body:** (empty)

**Response:**
```json
{
  "liked": true,
  "likeCount": 6,
  "project": { ...full project object... }
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 404: Project not found
- 500: Server error

---

### POST /api/projects/[id]/comments
Add a comment to a project.

**Authentication:** Required

**Parameters:**
- `id` (URL): Project ID

**Request Body:**
```json
{
  "text": "This is a great project!"
}
```

**Response:**
```json
{
  "comment": {
    "id": "1234567890",
    "userId": "507f1f77bcf86cd799439013",
    "userName": "John Doe",
    "userAvatar": "https://...",
    "text": "This is a great project!",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "commentCount": 3
}
```

**Status Codes:**
- 201: Comment created
- 400: Invalid request (missing text)
- 401: Not authenticated
- 404: Project not found
- 500: Server error

---

### DELETE /api/projects/[id]/comments/[commentId]
Delete a comment (comment author or project author only).

**Authentication:** Required

**Parameters:**
- `id` (URL): Project ID
- `commentId` (URL): Comment ID

**Response:**
```json
{
  "message": "Comment deleted"
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 403: Not authorized to delete
- 404: Comment or project not found
- 500: Server error

---

### POST /api/projects/[id]/share
Toggle share on a project.

**Authentication:** Required

**Parameters:**
- `id` (URL): Project ID

**Response:**
```json
{
  "shared": true,
  "shareCount": 3
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 404: Project not found
- 500: Server error

---

## Users API

### GET /api/users/me
Get current authenticated user's profile.

**Authentication:** Required

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://...",
  "profile": {
    "bio": "Software developer",
    "skills": ["JavaScript", "React"],
    "type": "student"
  },
  "following": ["507f1f77bcf86cd799439014", "..."],
  "followers": ["507f1f77bcf86cd799439015", "..."],
  "followerCount": 10,
  "followingCount": 5
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated
- 404: User not found
- 500: Server error

---

### GET /api/users/[id]
Get user profile by ID (public).

**Parameters:**
- `id` (URL): User ID

**Response:** Same as GET /api/users/me (without sensitive fields)

**Status Codes:**
- 200: Success
- 404: User not found
- 500: Server error

---

### GET /api/users/[id]/projects
Get all projects uploaded by a user.

**Parameters:**
- `id` (URL): User ID

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Project 1",
    ...
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Project 2",
    ...
  }
]
```

**Status Codes:**
- 200: Success
- 404: User not found
- 500: Server error

---

### POST /api/users/[id]/follow
Toggle follow/unfollow a user.

**Authentication:** Required

**Parameters:**
- `id` (URL): User ID to follow

**Request Body:** (empty)

**Response:**
```json
{
  "following": true,
  "followerCount": 11,
  "followingCount": 6
}
```

**Status Codes:**
- 200: Success
- 400: Cannot follow yourself
- 401: Not authenticated
- 404: User not found
- 500: Server error

---

## Mentors API

### GET /api/mentors
Get all mentors (users with type 'mentor').

**Authentication:** Not required

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Dr. Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://...",
    "profile": {
      "bio": "AI/ML Expert",
      "skills": ["Machine Learning", "Python"],
      "type": "mentor"
    },
    "followerCount": 25,
    "followingCount": 5
  }
]
```

**Status Codes:**
- 200: Success
- 500: Server error

---

## Activity API

### GET /api/activity/recent
Get recent activities from the platform.

**Authentication:** Not required

**Query Parameters:**
- `limit` (optional): Number of activities (default: 20, max: 100)
- `userId` (optional): Filter by user ID

**Response:**
```json
[
  {
    "_id": "project_507f1f77bcf86cd799439011",
    "type": "project_upload",
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "avatar": "https://..."
    },
    "project": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "My Awesome Project"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "description": "uploaded \"My Awesome Project\""
  }
]
```

**Activity Types:**
- `project_upload` - User uploaded a project
- `comment` - User commented (future)
- `like` - User liked a project (future)
- `follow` - User followed someone (future)

**Status Codes:**
- 200: Success
- 500: Server error

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error description message"
}
```

**Common Error Messages:**
- `"Unauthorized"` - Not authenticated (401)
- `"User not found"` - User doesn't exist (404)
- `"Project not found"` - Project doesn't exist (404)
- `"Comment not found"` - Comment doesn't exist (404)
- `"Not authorized to delete this comment"` - Permission denied (403)
- `"Cannot follow yourself"` - Invalid operation (400)

---

## Request/Response Examples

### Example 1: Like a Project
```bash
curl -X POST http://localhost:3000/api/projects/507f1f77bcf86cd799439011/like \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**
```json
{
  "liked": true,
  "likeCount": 5,
  "project": {...}
}
```

### Example 2: Add a Comment
```bash
curl -X POST http://localhost:3000/api/projects/507f1f77bcf86cd799439011/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "Great project!"}'
```

**Response:**
```json
{
  "comment": {
    "id": "1234567890",
    "userId": "507f1f77bcf86cd799439013",
    "userName": "John Doe",
    "userAvatar": "https://...",
    "text": "Great project!",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "commentCount": 3
}
```

### Example 3: Follow a Mentor
```bash
curl -X POST http://localhost:3000/api/users/507f1f77bcf86cd799439013/follow
```

**Response:**
```json
{
  "following": true,
  "followerCount": 26,
  "followingCount": 1
}
```

