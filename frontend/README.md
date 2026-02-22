# GitGraph Frontend

Next.js frontend for GitGraph. It provides GitHub login, repository browsing, and interactive repository graph visualization.

## Features

- GitHub OAuth sign-in flow with CSRF state validation
- Session-based auth via secure HTTP-only cookies
- Dashboard showing authenticated user's repositories
- Search/filter repositories and quick "recently viewed" list
- Import repository by GitHub URL
- Interactive repo graph visualization with expand/collapse folders
- Node details panel with file/folder context text

## App Routes

- `/login`
  - GitHub sign-in page.
- `/login/callback`
  - Completes OAuth exchange and redirects to dashboard.
- `/auth/github/callback`
  - Alias route that reuses `/login/callback`.
- `/`
  - Authenticated dashboard of repositories.
- `/repositories/[owner]/[repoName]`
  - Repository graph visualization page.

## Frontend API Routes (Next.js)

These routes proxy to the backend (`SERVER_BASE_URL`) and manage cookies.

- `GET /api/auth/session`
  - Returns `{ authenticated, username }` based on cookies.
- `GET /api/auth/github/login-url`
  - Gets OAuth URL from backend and sets `github_oauth_state` cookie.
- `POST /api/auth/github/exchange`
  - Validates OAuth state, exchanges code via backend, sets session cookies.
- `POST /api/auth/logout`
  - Invalidates backend session and clears auth cookies.
- `GET /api/repo`
  - Fetches authenticated user's GitHub repositories.
- `GET /api/repo/[owner]/[repoName]`
  - Fetches repository tree graph payload from backend.

## Setup

### 1. Prerequisites

- Node.js 20+
- Running backend API

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Set:

- `SERVER_BASE_URL=http://127.0.0.1:<backend_port>`

Example:

- `SERVER_BASE_URL=http://127.0.0.1:8000`

### 4. Run the app

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Cookie Usage

- `gitgraph_session` (HTTP-only): backend session id
- `github_username` (HTTP-only): username display helper
- `github_oauth_state` (HTTP-only, short-lived): OAuth CSRF protection
