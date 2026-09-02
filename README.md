# CodeSync

[![Live Demo](https://img.shields.io/badge/Live%20Demo-frontend--eight--virid.vercel.app-black?style=for-the-badge&logo=vercel)](https://frontend-eight-virid-ab5l50ahz2.vercel.app)

> Automatically sync your LeetCode and GeeksforGeeks solved problems to GitHub — one commit per problem.

🌐 **Live Demo:** https://frontend-eight-virid-ab5l50ahz2.vercel.app

## Quick Start

### Prerequisites
- Node.js 18+
- A GitHub Personal Access Token (fine-grained, **Contents: Read & Write** scope on your target repo)

### Setup

```bash
# 1. Clone / enter the project
cd codesync

# 2. Install backend deps
cd backend && npm install

# 3. Copy .env.example → .env and fill in your PAT + GitHub username
cp .env.example .env

# 4. Install frontend deps
cd ../frontend && npm install
```

### Run (development)

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open http://localhost:5173

---

## GitHub PAT Setup

1. Go to GitHub → Settings → Developer Settings → **Fine-grained personal access tokens**
2. Create a new token with:
   - **Repository access**: Only select repositories → pick your target repo
   - **Permissions → Contents**: Read and Write
3. Copy the token into your `.env` as `GITHUB_PAT`

⚠️ Never commit `.env` — it's in `.gitignore`.

---

## Config

Non-secret settings are stored in `backend/config.json` (auto-created on first run):

| Key | Description |
|-----|-------------|
| `leetcodeUsername` | Your LeetCode username |
| `gfgUsername` | Your GeeksforGeeks username |
| `githubRepo` | Target repo name (e.g. `my-solutions`) |
| `language` | Solution file language (`python`) |
| `scheduleEnabled` | Enable nightly auto-sync |
| `scheduleCron` | Cron expression (default: `0 23 * * *`) |

---

## Folder Structure (generated in your GitHub repo)

```
leetcode/
  easy/
    two-sum.py
  medium/
    add-two-numbers.py
  hard/
    median-of-two-sorted-arrays.py
gfg/
  reverse-a-linked-list.py
```

---

## Phases

- [x] Phase 0 — Scaffold
- [x] Phase 1 — LeetCode integration
- [x] Phase 2 — GFG integration
- [x] Phase 3 — Local ledger / diffing
- [x] Phase 4 — File generation
- [x] Phase 5 — Git commit automation
- [x] Phase 6 — Web dashboard
- [x] Phase 7 — Scheduling
- [ ] Phase 8 — Polish & tests

---

> Last updated: September 2026 — See [CHANGELOG.md](./CHANGELOG.md) for version history.
>
> 🚀 Deployed on [Vercel](https://frontend-eight-virid-ab5l50ahz2.vercel.app)

