# Changelog

All notable changes to CodeSync are documented here.

---

## [Unreleased]

### Planned
- End-to-end integration tests
- Browser extension for one-click syncing
- Support for additional competitive programming platforms (Codeforces, HackerRank)

---

## [0.9.0] — 2026-09-05

### Added
- Multi-language solution template generation (Python, C++, Java, JavaScript, TypeScript)
- Language selector in web dashboard Settings UI
- Comprehensive unit test suite with native Node.js test runner for file generator and ledger diff logic
- Enhanced system health & runtime diagnostic endpoint (`GET /api/health`)
- GitHub Actions CI pipeline with automated build, typecheck, and test validation

---

## [0.8.0] — 2026-09-04

### Added
- Local development fallback mode for authentication, configurations, secrets, and ledger
- Graceful Firebase initialization when environment variables are omitted
- Host listening configuration for frontend Vite development server

---

## [0.7.0] — 2026-08-31

### Added
- Phase 7: Scheduled nightly auto-sync via cron (`0 23 * * *` by default)
- Configurable cron expression through the dashboard
- Toggle to enable/disable scheduler without restarting the server

### Changed
- Improved error messaging on sync failures with retry hints

---

## [0.6.0] — 2026-08-20

### Added
- Phase 6: React + Vite web dashboard
- Real-time sync status display
- Manual "Sync Now" trigger button
- Config editor UI (username, repo, language, schedule)

---

## [0.5.0] — 2026-08-10

### Added
- Phase 5: Automated GitHub commits via REST API
- One commit per problem with descriptive commit messages
- Duplicate-detection to skip already-committed solutions

---

## [0.4.0] — 2026-08-01

### Added
- Phase 4: Solution file generation (Python)
- Folder structure: `leetcode/<difficulty>/<slug>.py` and `gfg/<slug>.py`

---

## [0.3.0] — 2026-07-20

### Added
- Phase 3: Local ledger (`ledger.json`) to track synced problems
- Diff logic to only sync new submissions since last run

---

## [0.2.0] — 2026-07-10

### Added
- Phase 2: GeeksforGeeks integration
- GFG solved-problems scraper

---

## [0.1.0] — 2026-07-01

### Added
- Phase 1: LeetCode integration
- LeetCode GraphQL API client for fetching accepted submissions

---

## [0.0.1] — 2026-06-25

### Added
- Phase 0: Initial project scaffold
- Backend (Node.js/Express/TypeScript)
- Frontend (React/Vite/TypeScript)
- `.env.example`, `.gitignore`, `.editorconfig`
