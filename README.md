# SDG Goal - Decent Work and Economic Growth

A platform connecting organizations with youth for internship opportunities. Built with Node.js, Express, MongoDB, and JWT authentication.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Configuration](#environment-configuration)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Email Notifications](#email-notifications)
- [Testing Guide](#testing-guide)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Project Overview

This platform enables:
- **Organizations** to post internship opportunities
- **Youth** to create profiles and discover internships
- **Admins** to manage and verify organizations and opportunities
- **Real-time tracking** of internship views, applications, and acceptance rates

**Goal:** Promote decent work and economic growth (SDG Goal 8) by providing equal opportunities for youth, especially in rural areas.

---

## ✨ Features

### For Organizations
- ✅ Create and manage organization profiles
- ✅ Post, edit, and manage internship opportunities
- ✅ Track internship views and applications
- ✅ View dashboard analytics
- ✅ Receive personalized suggestions to improve profile quality
- ✅ Manage organization documents and verification
- ✅ Email notifications for internship lifecycle events
- ✅ Weekly activity digest emails

### For Youth
- ✅ Create comprehensive profiles with skills and experience
- ✅ Upload CV/documents with validation
- ✅ View and manage profile details 
- ✅ Search and filter internship opportunities
- ✅ Apply for internships
- ✅ Track profile strength and eligibility
- ✅ Receive personalized suggestions to improve profile quality
- ✅ View rural support priority status

### For Admins
- ✅ Verify organizations and youth profiles
- ✅ Monitor platform activity
- ✅ Manage user accounts and roles
- ✅ Generate reports and analytics

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v14+
- **Framework:** Express.js
- **Database:** MongoDB (Atlas or Local)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Email Service:** Nodemailer (Gmail SMTP)
- **Scheduled Jobs:** node-cron
- **Payment Ready:** Stripe (optional)

### Frontend (To be implemented)
- **Framework:** React.js
- **State Management:** Redux / Context API
- **UI Library:** Material-UI / Tailwind CSS
- **HTTP Client:** Axios
- **Authentication:** JWT with localStorage/sessionStorage

### DevOps & Deployment
- **Version Control:** Git
- **API Testing:** Postman
- **Deployment:** Node.js hosting (Render)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

```bash
# Check Node.js version (required v14+)
node --version
npm --version

# Check Git
git --version
```

**Required Software:**
- ✅ Node.js v14+
- ✅ npm or yarn
- ✅ MongoDB (local or Atlas account)
- ✅ Git
- ✅ Postman (for API testing)
- ✅ VS Code or any code editor
- ✅ Gmail account with 2-Step Verification enabled (for email notifications)

---

## 🚀 Installation & Setup

### Quick Start (All Steps)

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/SDG-GOAL---Decent-work-and-economic-growth.git
cd SDG-GOAL---Decent-work-and-economic-growth

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT Secret, and Email credentials
npm start

# Backend should now be running on http://localhost:5000

# 3. Setup Frontend (when ready)
cd ../frontend
npm install
npm start

# Frontend should now be running on http://localhost:3000
```

---

## 🔧 Backend Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/SDG-GOAL---Decent-work-and-economic-growth.git
cd SDG-GOAL---Decent-work-and-economic-growth
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

**Dependencies Installed:**
- express
- mongoose
- dotenv
- jsonwebtoken
- bcryptjs
- cors (for frontend integration)
- nodemailer (email notifications)
- node-cron (weekly digest scheduler)

### Step 3: Create Environment File

```bash
cp .env.example .env
```

**Paste into `backend/.env`:**

```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/sdg-goal?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=development

# Email Configuration (Nodemailer + Gmail)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

### Step 4: Configure MongoDB Atlas (If Using Cloud)

1. **Create Account** at https://www.mongodb.com/cloud/atlas
2. **Create Cluster:** Free tier is fine for development
3. **Add IP Whitelist:** Go to Network Access → Add IP Address → `0.0.0.0/0`
4. **Create Database User:** Go to Database Access → Add New Database User
5. **Get Connection String:** Click Connect → Connect your application → Copy URI

### Step 5: Start Backend Server

```bash
npm start
```

**Expected Output:**
```
✅ Email service ready
📅 Weekly email cron scheduled (Mondays 08:00)
Server is running on port 5000
MongoDB connected ✅
```

---

## 🎨 Frontend Setup

### Step 1: Create React App

```bash
npx create-react-app frontend
cd frontend
```

### Step 2: Install Frontend Dependencies

```bash
npm install axios react-router-dom redux react-redux redux-thunk
npm install @mui/material @emotion/react @emotion/styled
```

### Step 3: Create `.env` File for Frontend

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Step 4: Create API Service

Create `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Step 5: Create Authentication Context

Create `frontend/src/context/AuthContext.js`:

```javascript
import React, { useState, createContext } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const register = async (name, email, password, role) => {
    try {
      const response = await API.post('/auth/register', { name, email, password, role });
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🔐 Environment Configuration

### Backend `.env` File

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://bridgeRural:mk123cod@cluster0.fquekvy.mongodb.net/sdg-goal?retryWrites=true&w=majority

# JWT
JWT_SECRET=atk1125
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (Nodemailer + Gmail SMTP)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

### Frontend `.env` File

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 🔑 Authentication

### Token Flow

```
1. User registers/logs in
2. Backend generates JWT token
3. Frontend stores token in localStorage
4. Frontend sends token in Authorization header for protected routes
5. Backend verifies token and allows/denies access
```

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "email": "admin@techcorp.com",
    "password": "password123",
    "role": "organization"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "password123"
  }'
```

**Response:**
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

**Option 1: Bearer Token (Postman) — Recommended**
1. Go to **Authorization** tab
2. Select **Bearer Token** from Type dropdown
3. Paste your token
4. Click Send

**Option 2: Headers Tab**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 🗺️ API Documentation

### Authentication Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/update` | ✅ | Update profile |
| DELETE | `/api/auth/:id` | ✅ | Delete user |

### Internship Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/internships` | ✅ | organization | Create internship |
| GET | `/api/internships/my-internships` | ✅ | organization | Get own internships |
| GET | `/api/internships/dashboard/stats` | ✅ | organization | Get dashboard stats |
| GET | `/api/internships/search` | ❌ | public | Search internships |
| GET | `/api/internships/:id` | ❌ | public | Get single internship |
| PUT | `/api/internships/:id` | ✅ | organization | Update internship |
| DELETE | `/api/internships/:id` | ✅ | organization | Delete internship |
| PUT | `/api/internships/view/:id` | ❌ | public | Increment view count |

### Youth Profile Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/profile` | ✅ | Create youth profile |
| GET | `/api/profile/:userId` | ✅ | Get profile by user ID |
| GET | `/api/profiles` | ✅ | Get all profiles |
| PUT | `/api/profile/:userId` | ✅ | Update youth profile |
| POST | `/api/profile/:userId/upload-cv` | ✅ | Upload CV/Documents |
| DELETE | `/api/profile/:userId` | ✅ | Delete youth profile |
| POST | `/api/applications` | ✅ | youth | Apply for an internship |
| GET | `/api/applications/my` | ✅ | youth | Get applications of logged-in user |
| GET | `/api/applications/:id` | ✅ | youth/org/admin | Get application details |
| DELETE | `/api/applications/:id` | ✅ | youth | Withdraw application |

### Organization Profile Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/organizations` | ✅ | Create organization profile |
| GET | `/api/organizations/:id` | ✅ | Get organization profile |
| GET | `/api/organizations` | ✅ | Get all organizations |
| PUT | `/api/organizations/:id` | ✅ | Update organization profile |
| POST | `/api/organizations/:id/documents` | ✅ | Upload documents |
| DELETE | `/api/organizations/:id` | ✅ | Delete organization profile |

### Application Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/applications/:id/status` | ✅ | Update application status (accept/reject) |
| GET | `/api/applications/internship/:internshipId` | ✅ | Get applications for a specific internship |

### Course Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/courses/my` | ✅ | Get courses created by the logged-in organizer |
| POST | `/api/courses` | ✅ | Create a course |
| PUT | `/api/courses/:id` | ✅ | Update a course |
| DELETE | `/api/courses/:id` | ✅ | Delete a course |

### Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profiles` | ✅ | View all youth profiles |
| DELETE | `/api/profile/:userId` | ✅ | Remove inappropriate user profile |
| GET | `/api/organizations` | ✅ | View all organizations |
| PUT | `/api/organizations/:id` | ✅ | Verify or update organization |
| DELETE | `/api/organizations/:id` | ✅ | Remove organization |
| GET | `/api/internships/:id` | ❌ | Review internship details |
| DELETE | `/api/internships/:id` | ✅ | Remove internship |


### Email Test Routes (Development Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/email/test/ping` | ❌ | Verify SMTP connection |
| POST | `/api/email/test/posted` | ❌ | Test internship posted email |
| POST | `/api/email/test/closed` | ❌ | Test internship closed email |
| POST | `/api/email/test/weekly` | ❌ | Test weekly digest email |


### Advisor (AI) Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/advisor/status` | ❌ | Check if AI advisor is enabled and get chat endpoint |
| POST | `/api/advisor/chat` | ❌ | Send chat messages to AI model and receive response |

> ⚠️ Email test routes are only available when `NODE_ENV=development`. They are automatically disabled in production.

---

## 📧 Email Notifications

The platform sends automated email notifications to organizations using **Nodemailer** with Gmail SMTP. A **weekly digest** is scheduled using **node-cron**.

### Setup

#### Step 1 — Install packages

```bash
npm install nodemailer node-cron
```

#### Step 2 — Enable Gmail App Password

1. Go to [https://myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under **"How you sign in to Google"** → enable **2-Step Verification**
4. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
5. Type `InternHub` in the App name box → click **Create**
6. Copy the 16-character password shown (e.g. `abcdefghijklmnop`)

#### Step 3 — Add to `.env`

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

> Do NOT use your real Gmail password. The App Password is separate and can be revoked at any time.

#### Step 4 — Verify on server start

When the server starts you should see:
```
✅ Email service ready
📅 Weekly email cron scheduled (Mondays 08:00)
```

---

### Email Triggers

Emails are sent to the organization automatically at these moments:

| Trigger | Email Type | Timing |
|---------|-----------|--------|
| Create internship with `status: "Active"` | Internship published confirmation | Instantly |
| Update internship: Draft → Active | Internship now live notification | Instantly |
| Update internship: Active → Closed | Internship closed summary | Instantly |
| Update internship: edit title/description/skills/etc | Fields updated notification | Instantly |
| Every Monday at 08:00 AM | Weekly activity digest | Scheduled |
| Create internship with `status: "Draft"` | Nothing | — |
| Delete internship | Nothing | — |

---

### Email Templates

#### 1. Internship Published
Sent when an internship goes Active. Includes title, location, duration, skills, and status.

#### 2. Internship Closed
Sent when an Active internship is closed. Includes total applicants and accepted count summary.

#### 3. Internship Updated
Sent when fields like title, description, location, duration, or skills are changed. Lists exactly which fields were updated.

#### 4. Weekly Digest
Sent every Monday at 08:00 AM to all organizations. Includes active listings count, total views, new applications, and overall acceptance rate.

---

### Testing Email Templates (Postman)

Make sure your server is running, then:

**Verify SMTP connection:**
```http
GET http://localhost:5000/api/email/test/ping
```

**Test internship posted email:**
```http
POST http://localhost:5000/api/email/test/posted
Content-Type: application/json

{ "to": "your.email@gmail.com" }
```

**Test internship closed email:**
```http
POST http://localhost:5000/api/email/test/closed
Content-Type: application/json

{ "to": "your.email@gmail.com" }
```

**Test weekly digest email:**
```http
POST http://localhost:5000/api/email/test/weekly
Content-Type: application/json

{ "to": "your.email@gmail.com" }
```

**Expected terminal output after each test:**
```
📧 Email sent → your.email@gmail.com | MessageId: <xxx@gmail.com>
```

---

### Teammate Integration (Component 3 — Applications)

The email service is designed to be shared across components. When the Applications component is built, it can import directly from the email utility:

```javascript
import { sendNewApplicationNotification } from "../utils/emailService.js";

// Call after Application.create() succeeds:
await sendNewApplicationNotification(
  orgEmail,        // organization's email address
  orgName,         // organization name
  internshipTitle, // title of the internship applied to
  applicantName,   // student's name
  applicantEmail   // student's email
);
```

---

### New Files Added for Email Feature

```
backend/src/
├── utils/
│   └── emailService.js      ← Nodemailer transporter + all email templates
├── jobs/
│   └── weeklyCron.js        ← node-cron weekly digest scheduler
└── routes/
    └── emailTestRoute.js    ← Dev-only test endpoints (auto-disabled in production)
```

---

## 🧪 Testing Guide

### STEP 1: Register Organization

**In Postman:**
- Method: **POST**
- URL: `http://localhost:5000/api/auth/register`
- Body (raw JSON):
```json
{
  "name": "Tech Corp",
  "email": "admin@techcorp.com",
  "password": "password123",
  "role": "organization"
}
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
✅ Copy the token and save it.

---

### STEP 2: Add Token to Postman Environment (Recommended)

1. Top right → click **Environments** (gear icon)
2. Add variable: `token` → paste the token value
3. Now use `{{token}}` in all Authorization fields

---

### STEP 3: Create Internship

- Method: **POST**
- URL: `http://localhost:5000/api/internships`
- Authorization: Bearer Token → `{{token}}`
- Body (raw JSON):
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

**Expected Response (201):**
```json
{
  "_id": "internship_123",
  "tittle": "Full Stack Developer Internship",
  "status": "Active",
  "viewCount": 0
}
```
✅ Save the `_id` for next steps.
✅ Since status is `"Active"`, an email confirmation is sent to the organization instantly.

---

### STEP 4: Get My Internships

- Method: **GET**
- URL: `http://localhost:5000/api/internships/my-internships`
- Authorization: Bearer Token → `{{token}}`

**Expected Response (200):**
```json
{
  "count": 1,
  "internships": [{ "_id": "internship_123", "tittle": "Full Stack Developer Internship" }]
}
```

---

### STEP 5: Get Single Internship (Public)

- Method: **GET**
- URL: `http://localhost:5000/api/internships/internship_123`
- Authorization: None (public route)

---

### STEP 6: Update Internship

- Method: **PUT**
- URL: `http://localhost:5000/api/internships/internship_123`
- Authorization: Bearer Token → `{{token}}`
- Body (raw JSON):
```json
{
  "status": "Closed",
  "description": "This internship is now full"
}
```
✅ Since status changes from `Active → Closed`, a closed summary email is sent instantly.

---

### STEP 7: Get Dashboard Stats

- Method: **GET**
- URL: `http://localhost:5000/api/internships/dashboard/stats`
- Authorization: Bearer Token → `{{token}}`

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

- Method: **DELETE**
- URL: `http://localhost:5000/api/internships/internship_123`
- Authorization: Bearer Token → `{{token}}`

**Expected Response (200):**
```json
{
  "message": "Internship deleted successfully"
}
```

---

### STEP 9: Test Email Notifications

- Method: **POST**
- URL: `http://localhost:5000/api/email/test/posted`
- Body (raw JSON):
```json
{ "to": "your.email@gmail.com" }
```

**Expected terminal output:**
```
📧 Email sent → your.email@gmail.com | MessageId: <xxx@gmail.com>
```

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
│   ├── fakeAuth.js
│   └── roleMiddleware.js
├── models/
│   ├── User.js
│   ├── internship.js
│   ├── OrganizationProfile.js
│   └── YouthProfile.js
├── jobs/
│   └── weeklyCron.js            ← NEW (email scheduler)
├── routes/
│   ├── auth.js
│   ├── internshipRoute.js
│   ├── organizationRoutes.js
│   ├── profile.js
│   └── emailTestRoute.js        ← NEW (dev only)
├── services/
│   ├── internshipService.js     ← UPDATED (email hooks added)
│   ├── organizationService.js
│   └── profileService.js
└── utils/
    ├── geocode.js
    └── emailService.js          ← NEW (Nodemailer templates)
```

---

## ❌ Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid credentials` | Register first before login | Use `/api/auth/register` first |
| `No token provided` | Missing Authorization header | Add `Authorization: Bearer TOKEN` |
| `You do not have permission` | Wrong user role | Ensure role is `"organization"` for internship routes |
| MongoDB Connection Error | Wrong URI or MongoDB not running | Check `.env` MONGO_URI |
| Port already in use | Another process using the port | Change `PORT` in `.env` or kill the process |
| `Missing credentials for "PLAIN"` | `EMAIL_USER`/`EMAIL_PASS` not loaded | Ensure `dotenv.config()` is called before imports in `server.js` |
| `Invalid login` email error | Using real Gmail password | Use Gmail App Password from myaccount.google.com/apppasswords |
| `App Passwords page not found` | 2-Step Verification not enabled | Enable it first at myaccount.google.com/security |
| `535 Authentication Failed` | Wrong `EMAIL_USER` format | Use full Gmail address e.g. `name@gmail.com` |

---

## 🎯 Quick Reference

**Base URL:** `http://localhost:5000`

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Register | POST | `/api/auth/register` | ❌ |
| Login | POST | `/api/auth/login` | ❌ |
| Create Internship | POST | `/api/internships` | ✅ |
| My Internships | GET | `/api/internships/my-internships` | ✅ |
| Get Internship | GET | `/api/internships/:id` | ❌ |
| Dashboard Stats | GET | `/api/internships/dashboard/stats` | ✅ |
| Search | GET | `/api/internships/search` | ❌ |
| Test Email | POST | `/api/email/test/posted` | ❌ |

---

## 📝 License

MIT License

---

## 📧 Support

For issues or questions, contact the development team.
