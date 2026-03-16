# CLAUDE.md — Repo Picks

This file provides context for AI assistants working in this codebase.

## Project Overview

**Repo Picks** is a mobile-friendly, single-page web app that lets users discover and bookmark GitHub repositories based on free-text interest queries. It runs entirely in the browser with no build step, no frameworks, and no backend.

## File Structure

```
├── index.html   # App shell and static markup
├── app.js       # All application logic (vanilla JS)
├── style.css    # All styles (CSS custom properties + component styles)
└── README.md    # Minimal project description
```

## Architecture

- **No build tooling** — open `index.html` directly in a browser or serve with any static file server.
- **No dependencies** — zero npm packages, zero CDN imports.
- **Single JS file** (`app.js`) handles all logic:
  - GitHub API calls via `fetch`
  - DOM rendering
  - Bookmark state management
  - Tab navigation
- **Persistence** — bookmarks are stored in `localStorage` under the key `repo-picks-bookmarks`.
- **External API** — GitHub REST API `GET /search/repositories`, unauthenticated (60 req/hour limit applies).

## Key Conventions

### HTML
- Use the `hidden` attribute (not `display: none` in CSS) to show/hide sections.
- Semantic elements: `<header>`, `<main>`, `<nav>`, `<section>`, `<form>`.
- All dynamic content is injected by `app.js`; the HTML is the skeleton only.

### CSS
- All design tokens are CSS custom properties defined on `:root` in `style.css`.
  - Colors: `--accent`, `--accent-light`, `--bg`, `--card-bg`, `--border`, `--text`, `--text-muted`, `--bookmark-active`
  - Layout: `--radius` (12px), `--shadow`
- Add new tokens to `:root` rather than hardcoding values.
- Mobile-first: `max-width: 680px` centered layout, full-width on small screens.

### JavaScript
- **No classes** — plain functions and module-level state (`let bookmarks`).
- **XSS safety** — always run untrusted strings through `escHtml()` before injecting into `innerHTML`. Never skip this for API-sourced data.
- **URL safety** — always use `encodeURIComponent()` when building query strings.
- Number formatting: use `fmtNum()` for star/fork counts (abbreviates ≥1000 as `1.0k`).
- DOM references are cached at the top of `app.js`; add new refs there, not inline.
- Async errors from `searchRepos()` are caught and rendered as `.error-msg` elements — maintain this pattern for any new async operations.

### Bookmarks
- A bookmark stores only the fields needed for rendering: `id`, `full_name`, `description`, `html_url`, `stargazers_count`, `forks_count`, `language`.
- After any change to `bookmarks`, call `saveBookmarks()` and then update the UI (`renderBookmarksTab()`, `updateBookmarkCount()`, `refreshBookmarkButtons()`).

## Development Workflow

### Running locally
```bash
# Any static file server works, e.g.:
npx serve .
# or simply open index.html in a browser
```

No install step, no compilation.

### Making changes
1. Edit `index.html`, `app.js`, or `style.css` directly.
2. Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`) to pick up changes.
3. There are no tests or linting configured; validate manually in the browser.

### GitHub API rate limits
Unauthenticated requests are limited to 60/hour per IP. For development, you can add a `Authorization: Bearer <token>` header to the `fetch` call in `searchRepos()` — do **not** commit tokens.

## Git Conventions

- Branch naming: `claude/<short-description>-<id>` (e.g. `claude/add-dark-mode-Abc12`)
- Commit style: imperative mood, single sentence (e.g. `Add dark mode toggle`)
- Push with: `git push -u origin <branch-name>`

## Security Notes

- All user-supplied and API-returned strings must pass through `escHtml()` before being set as `innerHTML`.
- `localStorage` data is parsed with a try/catch in `loadBookmarks()` — maintain this guard if modifying persistence logic.
- Do not add `eval`, `Function()`, or `dangerouslySetInnerHTML`-style patterns.
