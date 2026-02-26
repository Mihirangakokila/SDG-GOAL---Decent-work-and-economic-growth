# 🌍 SDG Goal - Decent Work and Economic Growth

**BridgeRural: Connecting Organizations with Rural Youth for Internship Opportunities**

A comprehensive platform that bridges the gap between organizations seeking talent and youth in rural or disadvantaged areas seeking internship opportunities. Built with a modern tech stack for scalability and performance.

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
- ✅ Manage organization documents and verification

### For Youth
- ✅ Create comprehensive profiles with skills and experience
- ✅ Search and filter internship opportunities
- ✅ Apply for internships
- ✅ Track profile strength and eligibility
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
- **Deployment:** Node.js hosting ( Render)

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
# Edit .env with your MongoDB URI and JWT Secret
npm start

# Backend should now be running on http://localhost:5001

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

### Step 3: Create Environment File

Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
# OR manually create .env
```

**Or manually paste into `backend/.env`:**

```env
# Server Configuration
PORT=5001

# MongoDB Configuration
# Option 1: Local MongoDB
MONGO_URI=mongodb://localhost:27017/sdg-goal

# Option 2: MongoDB Atlas (Recommended)
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/sdg-goal?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=development
```

### Step 4: Configure MongoDB Atlas (If Using Cloud)

1. **Create Account** at https://www.mongodb.com/cloud/atlas
2. **Create Cluster:** Free tier is fine for development
3. **Add IP Whitelist:**
   - Go to Network Access
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (for development) or your IP
4. **Create Database User:**
   - Go to Database Access
   - Click "Add New Database User"
   - Username: `bridgeRural` (or your choice)
   - Password: Strong password
5. **Get Connection String:**
   - Click "Connect"
   - Select "Connect your application"
   - Copy the MongoDB URI
   - Replace `USERNAME`, `PASSWORD`, `cluster0` in your `.env`

### Step 5: Start Backend Server

```bash
npm start
```

**Expected Output:**
```
MongoDB connected ✅
Server is running on port 5001
```

**Backend is now ready!** 🎉

---

## 🎨 Frontend Setup

### Step 1: Create React App

```bash
# From project root
npx create-react-app frontend
cd frontend
```

### Step 2: Install Frontend Dependencies

```bash
npm install axios react-router-dom redux react-redux redux-thunk
npm install @mui/material @emotion/react @emotion/styled  # or use Tailwind
```

### Step 3: Create `.env` File for Frontend

```bash
cd frontend
# Create .env file
```

**Paste in `frontend/.env`:**

```env
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

### Step 4: Create API Service

Create `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Add token to requests
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
      const response = await API.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
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

### Step 6: Start Frontend

```bash
npm start
```

**Frontend runs on:** `http://localhost:3000`

---

## 🔐 Environment Configuration

### Backend `.env` File

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://bridgeRural:mk123cod@cluster0.fquekvy.mongodb.net/sdg-goal?retryWrites=true&w=majority

# JWT
JWT_SECRET=atk1125
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env` File

```env
REACT_APP_API_BASE_URL=http://localhost:5001/api
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

### Getting Started with Authentication

#### 1. Register

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "email": "admin@techcorp.com",
    "password": "password123",
    "role": "organization"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
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
    "id": "65abc123",
    "name": "Tech Corp",
    "email": "admin@techcorp.com",
    "role": "organization"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Use Token

Add to request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/update` | ✅ | Update profile |
| DELETE | `/auth/:id` | ✅ | Delete user |

### Internship Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/internships` | ✅ org | Create internship |
| GET | `/internships/my-internships` | ✅ org | Get my internships |
| GET | `/internships/:id` | ❌ | Get single internship |
| PUT | `/internships/:id` | ✅ org | Update internship |
| DELETE | `/internships/:id` | ✅ org | Delete internship |
| GET | `/internships/dashboard/stats` | ✅ org | Get stats |
| GET | `/internships/search` | ❌ | Search internships |

### Youth Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/profile` | ✅ youth | Create profile |
| GET | `/profile/:userId` | ✅ | Get profile |
| GET | `/profiles` | ✅ | Get all profiles |
| PUT | `/profile/:userId` | ✅ | Update profile |
| POST | `/profile/:userId/upload-cv` | ✅ | Upload CV |
| DELETE | `/profile/:userId` | ✅ | Delete profile |

### Organization Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/organizations` | ✅ org | Create org profile |
| GET | `/organizations/:id` | ✅ | Get org profile |
| GET | `/organizations` | ✅ | Get all organizations |
| PUT | `/organizations/:id` | ✅ | Update org profile |
| POST | `/organizations/:id/documents` | ✅ | Upload documents |
| DELETE | `/organizations/:id` | ✅ | Delete org profile |

---

## 🧪 Testing Guide

### Using Postman

#### 1. Create Collection

1. Open Postman
2. Create new collection: "SDG-Goal"
3. Create environment: "Development"
4. Add variables:
   - `base_url`: `http://localhost:5001/api`
   - `token`: (leave empty)

#### 2. Test Sequence

**Register Organization:**
```
POST {{base_url}}/auth/register

Body:
{
  "name": "Tech Corp",
  "email": "admin@techcorp.com",
  "password": "password123",
  "role": "organization"
}
```

**Tests Tab (Save token):**
```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.token);
```

**Create Internship:**
```
POST {{base_url}}/internships

Headers:
Authorization: Bearer {{token}}

Body:
{
  "tittle": "Full Stack Developer",
  "description": "Learn MERN stack",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "location": "Bangalore",
  "duration": "3 months",
  "status": "Active"
}
```

**Get My Internships:**
```
GET {{base_url}}/internships/my-internships

Headers:
Authorization: Bearer {{token}}
```

---

## 📁 Project Structure

```
SDG-GOAL---Decent-work-and-economic-growth/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── internshipController.js
│   │   │   ├── organizationController.js
│   │   │   └── profileController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── internship.js
│   │   │   ├── OrganizationProfile.js
│   │   │   └── YouthProfile.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── internshipRoute.js
│   │   │   ├── organizationRoutes.js
│   │   │   └── profile.js
│   │   └── services/
│   │       ├── internshipService.js
│   │       ├── organizationService.js
│   │       └── profileService.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/ (To be created)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `ENOTFOUND _mongodb._tcp.cluster0...`

**Solutions:**
1. Add IP to Atlas whitelist (0.0.0.0/0)
2. Verify MONGO_URI in .env
3. Check internet connection
4. Ensure credentials are correct

### JWT Token Issues

**Error:** `Token is not valid`

**Solutions:**
1. Token might be expired (7 days)
2. Re-login to get new token
3. Check JWT_SECRET matches in .env
4. Verify token format: `Bearer YOUR_TOKEN`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5001`

**Solutions:**
```bash
# Kill process on port 5001 (Windows)
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5002
```

### CORS Issues (Frontend-Backend)

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions:**
1. Add CORS to backend (install cors package):
```javascript
import cors from 'cors';
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

2. Verify API URL matches in frontend .env

---

## 🔄 Deployment Checklist

### Backend Deployment (Heroku/Render)

- [ ] Create account on Heroku/Render
- [ ] Connect GitHub repository
- [ ] Set environment variables in platform
- [ ] Deploy branch
- [ ] Test API endpoints

### Frontend Deployment (Vercel/Netlify)

- [ ] Build frontend: `npm run build`
- [ ] Deploy to Vercel/Netlify
- [ ] Update API_BASE_URL to production backend
- [ ] Test all features

---

## 📝 Git Workflow

### Cloning with Branches

```bash
# Clone repository
git clone https://github.com/your-repo/SDG-GOAL.git

# List branches
git branch -a

# Checkout auth_internship branch
git checkout auth_internship

# Or create new feature branch
git checkout -b feature/your-feature-name

# Make changes
git add .
git commit -m "Add feature: your description"
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

---

## 👥 User Roles

### 1. **Youth** (`role: "youth"`)
- Can create profile
- Can search internships
- Can apply for internships
- Can view own profile

### 2. **Organization** (`role: "organization"`)
- Can create organization profile
- Can post internships
- Can manage internships
- Can view applications
- Can track dashboard stats

### 3. **Admin** (`role: "admin"`)
- Can manage all users
- Can verify organizations
- Can monitor platform
- Can delete content
- Can view all profiles

---

## 🎓 Learning Resources

- **Node.js:** https://nodejs.org/en/docs/
- **Express:** https://expressjs.com/en/4x/api.html
- **MongoDB:** https://docs.mongodb.com/
- **JWT:** https://jwt.io/
- **React:** https://react.dev/learn

---

## 📞 Support & Contact

For issues or questions:
- Open a GitHub issue
- Contact development team
- Check documentation in README

---

## 📄 License

MIT License - Free to use and modify

---

## ✅ Quick Reference Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm start            # Start server (port 5001)
npm run dev          # Start with nodemon

# Frontend
cd frontend
npm install          # Install dependencies
npm start            # Start app (port 3000)
npm run build        # Build for production
npm test             # Run tests

# Git
git status           # Check status
git add .            # Stage changes
git commit -m "msg"  # Commit
git push             # Push to remote
git pull             # Pull from remote
```

---

## 🚀 Next Steps

1. **Clone the repository**
2. **Setup backend** → Run on port 5001
3. **Test API** → Use Postman
4. **Setup frontend** → Create React app
5. **Connect frontend** → Update API URLs
6. **Deploy** → Host on cloud

---

**Happy Coding! 🎉**

*SDG Goal 8: Decent Work and Economic Growth*
