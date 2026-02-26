# SDG Goal - Decent Work and Economic Growth

A platform connecting organizations with youth for internship opportunities. Built with Node.js, Express, MongoDB, and JWT authentication.

---

## 📋 Table of Contents

- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- npm or yarn
- Postman (for testing)

### Installation Steps

```bash
# Clone the repository
git clone <repo-url>
cd SDG-GOAL---Decent-work-and-economic-growth

# Install dependencies
cd backend
npm install

# Start the server
npm start
```

### Server Running
```
Server is running on port 5001
MongoDB connected ✅
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017/sdg-goal
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sdg-goal

PORT=5001
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

---

## 🔑 Authentication

### Getting a Token

All protected routes require a Bearer token in the Authorization header.

#### Step 1: Register (Create Account)

**Endpoint:**
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "Tech Corp",
  "email": "admin@techcorp.com",
  "password": "password123",
  "role": "organization"
}
```

**Roles Available:** `youth`, `organization`, `admin`

**Response (200):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "65abc123def456",
    "name": "Tech Corp",
    "email": "admin@techcorp.com",
    "role": "organization",
    "createdAt": "2026-02-26T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Login

**Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@techcorp.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Logged in successfully",
  "user": {
    "id": "65abc123def456",
    "name": "Tech Corp",
    "email": "admin@techcorp.com",
    "role": "organization"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using Token in Requests

#### Option 1: Bearer Token (Postman) - RECOMMENDED
1. Go to **Authorization** tab
2. Select **Bearer Token** from Type dropdown
3. Paste your token in the Token field
4. Click Send

#### Option 2: Headers Tab
Add to request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Option 3: cURL
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 🗺️ API Routes

### Authentication Routes

#### Register User
```http
POST /api/auth/register
```
**Required Body:** `name`, `email`, `password`, `role`
**Response:** User object + token

#### Login User
```http
POST /api/auth/login
```
**Required Body:** `email`, `password`
**Response:** User object + token

#### Get Current User
```http
GET /api/auth/me
Authentication: Required ✅
```

#### Update Profile (Email/Password)
```http
PUT /api/auth/update
Authentication: Required ✅
```

#### Delete User
```http
DELETE /api/auth/:id
Authentication: Required ✅
```

---

### Internship Routes ⭐

#### Create Internship
```http
POST /api/internships
Authentication: Required ✅
Authorization: organization role only
```

**Request Body:**
```json
{
  "tittle": "Full Stack Developer Internship",
  "description": "Learn MERN stack development",
  "requiredSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "requiredEducation": "Bachelor in Computer Science",
  "location": "Bangalore, India",
  "duration": "3 months",
  "status": "Active"
}
```

#### Get My Internships
```http
GET /api/internships/my-internships
Authentication: Required ✅
Authorization: organization role only
```

#### Get Single Internship
```http
GET /api/internships/:id
Authentication: Not required ❌ (Public)
```

#### Update Internship
```http
PUT /api/internships/:id
Authentication: Required ✅
Authorization: organization role only
```

#### Delete Internship
```http
DELETE /api/internships/:id
Authentication: Required ✅
Authorization: organization role only
```

#### Get Dashboard Stats
```http
GET /api/internships/dashboard/stats
Authentication: Required ✅
Authorization: organization role only
```

#### Search Internships
```http
GET /api/internships/search?keyword=developer&location=Bangalore
Authentication: Not required ❌ (Public)
```

---

### Youth Profile Routes

#### Create Youth Profile
```http
POST /api/profile
Authentication: Required ✅
Authorization: youth role only
```

#### Get Profile by User ID
```http
GET /api/profile/:userId
Authentication: Required ✅
```

#### Get All Profiles
```http
GET /api/profiles
Authentication: Required ✅
```

#### Update Youth Profile
```http
PUT /api/profile/:userId
Authentication: Required ✅
Authorization: youth or admin
```

#### Upload CV/Documents
```http
POST /api/profile/:userId/upload-cv
Authentication: Required ✅
```

#### Delete Youth Profile
```http
DELETE /api/profile/:userId
Authentication: Required ✅
```

---

### Organization Profile Routes

#### Create Organization Profile
```http
POST /api/organizations
Authentication: Required ✅
Authorization: organization role only
```

#### Get Organization Profile
```http
GET /api/organizations/:id
Authentication: Required ✅
```

#### Get All Organizations
```http
GET /api/organizations
Authentication: Required ✅
```

#### Update Organization Profile
```http
PUT /api/organizations/:id
Authentication: Required ✅
```

#### Upload Organization Documents
```http
POST /api/organizations/:id/documents
Authentication: Required ✅
```

#### Delete Organization Profile
```http
DELETE /api/organizations/:id
Authentication: Required ✅
```

---

## 🧪 Testing Guide - Step by Step

### STEP 1: Register Organization

**In Postman:**

1. Create new request
2. Method: **POST**
3. URL: `http://localhost:5001/api/auth/register`
4. Body tab → Select **raw** → **JSON**
5. Paste:
```json
{
  "name": "Tech Corp",
  "email": "admin@techcorp.com",
  "password": "password123",
  "role": "organization"
}
```
6. Click **Send**

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**✅ Copy the token and save it somewhere**

---

### STEP 2: Add Token to Environment (Optional but Recommended)

1. In Postman top right, click **Environment settings** (gear icon)
2. Click **add environment** or select existing
3. Add variable:
   - **Variable:** `token`
   - **Value:** (paste the token from step 1)
4. Save

Now use `{{token}}` in Authorization header

---

### STEP 3: Create Internship

**In Postman:**

1. Create new request
2. Method: **POST**
3. URL: `http://localhost:5001/api/internships`
4. **Authorization** tab → Type: **Bearer Token** → Token: (paste from step 1 OR use `{{token}}`)
5. **Body** tab → Select **raw** → **JSON**
6. Paste:
```json
{
  "tittle": "Full Stack Developer Internship",
  "description": "Learn MERN stack - Node.js, React, MongoDB",
  "requiredSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "requiredEducation": "Bachelor in Computer Science",
  "location": "Bangalore, India",
  "duration": "3 months",
  "status": "Active"
}
```
7. Click **Send**

**Expected Response (201):**
```json
{
  "_id": "internship_123",
  "tittle": "Full Stack Developer Internship",
  "organizationId": "user_id",
  "status": "Active",
  "viewCount": 0
}
```

**✅ Save the `_id` value for next tests**

---

### STEP 4: Get My Internships (Organization View)

**In Postman:**

1. Method: **GET**
2. URL: `http://localhost:5001/api/internships/my-internships`
3. **Authorization** → Bearer Token → `{{token}}`
4. Click **Send**

**Expected Response (200):**
```json
{
  "count": 1,
  "internships": [
    {
      "_id": "internship_123",
      "tittle": "Full Stack Developer Internship",
      ...
    }
  ]
}
```

---

### STEP 5: Get Single Internship (Public View)

**In Postman:**

1. Method: **GET**
2. URL: `http://localhost:5001/api/internships/internship_123` (use your `_id` from step 3)
3. **Authorization** → None (this is public)
4. Click **Send**

**Expected Response (200):**
```json
{
  "_id": "internship_123",
  "tittle": "Full Stack Developer Internship",
  "description": "Learn MERN stack...",
  ...
}
```

---

### STEP 6: Update Internship

**In Postman:**

1. Method: **PUT**
2. URL: `http://localhost:5001/api/internships/internship_123`
3. **Authorization** → Bearer Token → `{{token}}`
4. **Body** → Select **raw** → **JSON**
5. Paste:
```json
{
  "status": "Closed",
  "description": "This internship is now full"
}
```
6. Click **Send**

**Expected Response (200):**
```json
{
  "_id": "internship_123",
  "status": "Closed",
  ...
}
```

---

### STEP 7: Get Dashboard Stats

**In Postman:**

1. Method: **GET**
2. URL: `http://localhost:5001/api/internships/dashboard/stats`
3. **Authorization** → Bearer Token → `{{token}}`
4. Click **Send**

**Expected Response (200):**
```json
{
  "totalInternships": 1,
  "activeInternships": 0,
  "closedInternships": 1,
  "totalViews": 0,
  "totalApplicants": 0,
  "acceptanceRate": "0"
}
```

---

### STEP 8: Delete Internship

**In Postman:**

1. Method: **DELETE**
2. URL: `http://localhost:5001/api/internships/internship_123`
3. **Authorization** → Bearer Token → `{{token}}`
4. Click **Send**

**Expected Response (200):**
```json
{
  "message": "Internship deleted successfully"
}
```

---

## ❌ Troubleshooting

| Error | Solution |
|-------|----------|
| "Invalid credentials" | Register first with `/api/auth/register` before login |
| "No token provided" | Add `Authorization: Bearer TOKEN` header in Authorization tab |
| "You do not have permission" | Ensure user role is "organization" for internship routes |
| MongoDB Connection Error | Check `.env` MONGO_URI and ensure MongoDB is running |
| Port already in use | Change PORT in `.env` or kill process using port 5001 |

---

## 📚 Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Environment:** dotenv

---

## 📁 Project Structure

```
backend/src/
├── controllers/
│   ├── authController.js
│   ├── internshipController.js
│   ├── organizationController.js
│   └── profileController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── fakeAuth.js (legacy)
│   └── roleMiddleware.js (legacy)
├── models/
│   ├── User.js
│   ├── internship.js
│   ├── OrganizationProfile.js
│   └── YouthProfile.js
├── routes/
│   ├── auth.js
│   ├── internshipRoute.js
│   ├── organizationRoutes.js
│   └── profile.js
└── services/
    ├── internshipService.js
    ├── organizationService.js
    └── profileService.js
```

---

## 🎯 Quick Reference

**Base URL:** `http://localhost:5001`

**Main Endpoints:**
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Create Internship: `POST /api/internships` (+ token)
- Get My Internships: `GET /api/internships/my-internships` (+ token)
- Get Internship: `GET /api/internships/:id` (public)
- Dashboard: `GET /api/internships/dashboard/stats` (+ token)

---

## 📝 License

MIT License

---

## 📧 Support

For issues or questions, contact the development team.
