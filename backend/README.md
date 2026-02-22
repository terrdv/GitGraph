# GitGraph Backend

FastAPI backend for GitGraph. It handles GitHub OAuth, session management, repository/file reads from GitHub, and repository tree graph generation.

## Features

- GitHub OAuth login URL generation and code exchange
- Secure server-side session handling (`x-session-id`)
- Encrypted GitHub token storage with Fernet
- Repository listing from the authenticated GitHub user
- Repository tree graph generation (`nodes` and `edges`) for visualization
- File content fetch endpoint for selected repository files
- Gemini analysis endpoint scaffold

## API Endpoints

### Health

- `GET /`
  - Returns API status.

### Auth

- `GET /auth/github/login-url`
  - Builds a GitHub OAuth URL.
  - Query params:
    - `state` (optional)
    - `scope` (optional, defaults to `repo read:user`)
- `GET /auth/github/callback`
  - Redirect bridge to frontend callback (`/login/callback`).
- `POST /auth/github/exchange`
  - Exchanges GitHub `code` for access token, stores token, creates session.
  - Body:
    - `code: string`
  - Returns:
    - `session_id`
    - `username`
- `POST /auth/logout`
  - Invalidates current session if `x-session-id` is provided.

### Repositories

- `GET /repos`
  - Returns authenticated user's repositories from GitHub.
  - Auth:
    - `Authorization: Bearer <github_token>` or
    - `x-session-id: <session_id>`
- `GET /repos/{owner}/{repo}/tree`
  - Returns graph payload:
    - `repo_id`
    - `nodes[]`
    - `edges[]`
- `GET /repos/{owner}/{repo}/file?path=<repo_path>`
  - Returns decoded file contents for a single file path.

### Analysis

- `POST /analyze/code_analysis`
  - Gemini analysis endpoint (currently scaffolded and returns generated response model output).

## Setup

### 1. Prerequisites

- Python 3.11+
- PostgreSQL database

### 2. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Required variables in `.env`:

- `PORT`
- `DATABASE_URL`
- `FERNET_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `FRONTEND_BASE_URL`
- `GEMINI_API_KEY` (required for `/analyze/*`)

Generate a Fernet key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 4. Prepare database tables

This service expects `users` and `access_tokens` tables to exist. `user_sessions` is auto-created at runtime.

Minimal schema:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS access_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL
);
```

### 5. Run the server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Notes

- CORS is currently configured as permissive (`*`) in `app/core/config.py`.
- Sessions are opaque IDs hashed with SHA-256 before DB storage.
- OAuth callback is designed for frontend-first flow via `FRONTEND_BASE_URL`.
