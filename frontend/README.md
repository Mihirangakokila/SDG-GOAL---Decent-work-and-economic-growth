# 🌉 BridgeRural — Frontend

> Connecting rural youth with internship opportunities | SDG Goal 8 — Decent Work and Economic Growth

---

## 📌 Project Overview

BridgeRural is a MERN stack web application that bridges the gap between rural youth and organizations offering internships. This repository contains the **frontend** of the application built with **React + Vite**.

This frontend is part of a group university project with 4 components:
- Component 1: Authentication & Youth Profile
- Component 2: Internship Management 
- Component 3: Applications & Matching
- Component 4: Training & Skill Development

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| Vite + SWC | Build Tool |
| Tailwind CSS v3 | Styling |
| React Router DOM | Client-side Routing |
| Axios | HTTP Requests to Backend |

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js              # Axios base config with JWT interceptor
│   ├── components/
│   │   └── Navbar.jsx            # Shared navigation component
│   ├── pages/
│   │   ├── internships/
│   │   │   ├── InternshipList.jsx      # Browse & search internships
│   │   │   ├── InternshipDetail.jsx    # Single internship view
│   │   │   └── CreateInternship.jsx    # Create new internship (org)
│   │   └── dashboard/
│   │       └── Dashboard.jsx           # Organization analytics dashboard
│   ├── context/
│   │   └── AuthContext.jsx       # JWT token & auth state management
│   ├── App.jsx                   # Route definitions
│   ├── main.jsx                  # App entry point
│   └── index.css                 # Tailwind base styles
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) v18+
- npm v9+
- Backend server running on `http://localhost:5000`

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/SDG-GOAL---Decent-work-and-economic-growth.git
cd SDG-GOAL---Decent-work-and-economic-growth/frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## 🔗 Backend Connection

This frontend connects to the backend API running at `http://localhost:5000`.

The Vite proxy is configured in `vite.config.js` to avoid CORS issues:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

Make sure the backend is running before starting the frontend.

---

## 🛣️ Routes

| Path | Page | Access |
|---|---|---|
| `/` | Internship List | Public |
| `/internships/:id` | Internship Detail | Public |
| `/internships/create` | Create Internship | Organization only |
| `/dashboard` | Analytics Dashboard | Organization only |

---

## 🌍 Key Features (Component 2)

- 📋 **Browse Internships** — View all active internships
- 🔍 **Search & Filter** — Filter by keyword, skills, location (geocoded), status
- 📍 **Location-Based Search** — OpenCage Geocoding API integration (50km radius)
- ➕ **Create Internship** — Organizations can post new internships
- ✏️ **Edit / Delete** — Manage existing internship postings
- 📊 **Dashboard Analytics** — View total internships, applicants, views, acceptance rate

---

## 🔐 Authentication

JWT tokens are stored in `localStorage` and automatically attached to all API requests via Axios interceptor in `src/api/axios.js`.

Roles supported:
- `youth` — Browse and apply for internships
- `organization` — Create and manage internships, view dashboard
- `admin` — Full system access

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 👥 Group Members

| Name | Component |
|---|---|
| Member 1 | Authentication & Youth Profile |
| Aathika | Internship Management |
| Member 3 | Applications & Matching |
| Member 4 | Training & Skill Development |

---

## 📄 License

This project is developed for academic purposes as part of a university assignment.