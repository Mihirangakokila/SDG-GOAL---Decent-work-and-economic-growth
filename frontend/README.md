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
