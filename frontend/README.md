# InternHub — Frontend

React + Vite + Tailwind CSS frontend for the InternHub internship portal.

## Tech Stack

- **React 18** + React Router v6
- **Vite 5** (dev server + build)
- **Tailwind CSS 3** (utility-first styling)
- **Axios** (API client with interceptors)
- **react-hot-toast** (notifications)
- **lucide-react** (icons)
- **date-fns** (date formatting)
- **Google Fonts** — Sora (display) + DM Sans (body)

---

## Project Structure

```
src/
├── components/
│   ├── common/          # PrivateRoute, Pagination
│   ├── layout/          # Navbar, Footer, Layout
│   ├── internship/      # InternshipCard, SearchBar
│   └── dashboard/       # StatCard
├── context/
│   └── AuthContext.jsx  # JWT auth state
├── pages/
│   ├── HomePage.jsx
│   ├── InternshipsPage.jsx
│   ├── InternshipDetailPage.jsx
│   ├── DashboardPage.jsx
│   ├── PostInternshipPage.jsx  # handles both create & edit
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── NotFoundPage.jsx
├── services/
│   └── api.js           # Axios instance + all API calls
└── utils/
    └── helpers.js       # Formatting utilities
```

---

<<<<<<< HEAD
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
=======
## Setup

### Prerequisites
- Node.js 18+
- Your backend running on `http://localhost:5001`

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /api → localhost:5001)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

---

## Environment / Proxy

The Vite dev server proxies all `/api/*` requests to `http://localhost:5001`.
This is configured in `vite.config.js`.

For production, configure your web server (nginx / reverse proxy) to forward
`/api` to your backend service, or set `VITE_API_BASE_URL` and update
`src/services/api.js` accordingly.

---

## Features

| Page                  | Route                    | Auth Required |
|-----------------------|--------------------------|---------------|
| Home / Landing        | `/`                      | No            |
| Browse Internships    | `/internships`           | No            |
| Internship Detail     | `/internships/:id`       | No            |
| Login                 | `/login`                 | No            |
| Register              | `/register`              | No            |
| Org Dashboard         | `/dashboard`             | Org only      |
| Post Internship       | `/dashboard/post`        | Org only      |
| Edit Internship       | `/dashboard/edit/:id`    | Org only      |

---

## API Integration

All API calls live in `src/services/api.js`:

```js
authAPI.login(data)
authAPI.register(data)

internshipsAPI.search(params)
internshipsAPI.getById(id)
internshipsAPI.getMine(params)
internshipsAPI.create(data)
internshipsAPI.update(id, data)
internshipsAPI.delete(id)
internshipsAPI.incrementView(id)
internshipsAPI.dashboard()
```

The Axios interceptor automatically:
- Attaches the JWT token to every request
- Redirects to `/login` on 401 responses
>>>>>>> 0caec404cce155c23bff22f48655f2c322b2b075
