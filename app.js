const BOOKMARKS_KEY = 'repo-picks-bookmarks';

// --- State ---
let bookmarks = loadBookmarks();

// --- DOM refs ---
const form = document.getElementById('search-form');
const input = document.getElementById('interests-input');
const resultsEl = document.getElementById('results');
const discoverState = document.getElementById('discover-state');
const bookmarksListEl = document.getElementById('bookmarks-list');
const bookmarksState = document.getElementById('bookmarks-state');
const bookmarkCount = document.getElementById('bookmark-count');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// --- GitHub API ---
async function searchRepos(query) {
  const encoded = encodeURIComponent(query.trim());
  const url = `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=20`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `GitHub API error (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

// --- Rendering ---
function renderRepos(repos, container) {
  container.innerHTML = '';
  repos.forEach(repo => {
    container.appendChild(buildCard(repo));
  });
}

function buildCard(repo) {
  const isBookmarked = bookmarks.some(b => b.id === repo.id);
  const card = document.createElement('div');
  card.className = 'repo-card';
  card.dataset.id = repo.id;

  card.innerHTML = `
    <div class="repo-card-header">
      <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">
        ${escHtml(repo.full_name)}
      </a>
      <button
        class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
        aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark this repo'}"
        data-id="${repo.id}"
      >${isBookmarked ? '★' : '☆'}</button>
    </div>
    ${repo.description ? `<p class="repo-desc">${escHtml(repo.description)}</p>` : ''}
    <div class="repo-meta">
      <span>★ ${fmtNum(repo.stargazers_count)}</span>
      ${repo.language ? `<span>${escHtml(repo.language)}</span>` : ''}
      ${repo.forks_count ? `<span>⑂ ${fmtNum(repo.forks_count)}</span>` : ''}
    </div>
  `;

  card.querySelector('.bookmark-btn').addEventListener('click', () => {
    toggleBookmark(repo);
    refreshBookmarkButtons(repo.id);
    renderBookmarksTab();
    updateBookmarkCount();
  });

  return card;
}

function refreshBookmarkButtons(repoId) {
  const isBookmarked = bookmarks.some(b => b.id === repoId);
  document.querySelectorAll(`.bookmark-btn[data-id="${repoId}"]`).forEach(btn => {
    btn.textContent = isBookmarked ? '★' : '☆';
    btn.classList.toggle('bookmarked', isBookmarked);
    btn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Bookmark this repo');
  });
}

// --- Bookmarks ---
function toggleBookmark(repo) {
  const idx = bookmarks.findIndex(b => b.id === repo.id);
  if (idx === -1) {
    bookmarks.push({
      id: repo.id,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language
    });
  } else {
    bookmarks.splice(idx, 1);
  }
  saveBookmarks();
}

function saveBookmarks() {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  } catch {
    return [];
  }
}

function renderBookmarksTab() {
  if (bookmarks.length === 0) {
    bookmarksState.hidden = false;
    bookmarksListEl.hidden = true;
    return;
  }
  bookmarksState.hidden = true;
  bookmarksListEl.hidden = false;
  renderRepos(bookmarks, bookmarksListEl);
}

function updateBookmarkCount() {
  bookmarkCount.textContent = bookmarks.length > 0 ? bookmarks.length : '';
}

// --- Tabs ---
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabContents.forEach(tc => {
      tc.hidden = tc.id !== target;
      tc.classList.toggle('active', tc.id === target);
    });
    if (target === 'bookmarks') renderBookmarksTab();
  });
});

// --- Search form ---
form.addEventListener('submit', async e => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  discoverState.innerHTML = '<div class="loading">Searching GitHub...</div>';
  discoverState.hidden = false;
  resultsEl.hidden = true;

  try {
    const repos = await searchRepos(query);
    discoverState.hidden = true;
    if (repos.length === 0) {
      discoverState.innerHTML = '<div class="empty-state"><p>No repos found. Try different interests.</p></div>';
      discoverState.hidden = false;
      return;
    }
    renderRepos(repos, resultsEl);
    resultsEl.hidden = false;
  } catch (err) {
    discoverState.innerHTML = `<div class="error-msg">Could not fetch repos: ${escHtml(err.message)}</div>`;
    discoverState.hidden = false;
  }
});

// --- Helpers ---
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// --- Init ---
updateBookmarkCount();
