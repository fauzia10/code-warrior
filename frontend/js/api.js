// frontend/js/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Central API helper — all fetch() calls go through here.
// This keeps our code DRY (Don't Repeat Yourself).
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api';

// ── Get the stored JWT token ──────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('cw_token');
}

// ── Save login data to localStorage ──────────────────────────────────────
function saveSession(token, user, stats) {
  localStorage.setItem('cw_token', token);
  localStorage.setItem('cw_user', JSON.stringify(user));
  localStorage.setItem('cw_stats', JSON.stringify(stats || {}));
}

// ── Clear session (logout) ────────────────────────────────────────────────
function clearSession() {
  localStorage.removeItem('cw_token');
  localStorage.removeItem('cw_user');
  localStorage.removeItem('cw_stats');
}

// ── Get current user from localStorage ───────────────────────────────────
function getCurrentUser() {
  const u = localStorage.getItem('cw_user');
  return u ? JSON.parse(u) : null;
}

// ── Get current stats from localStorage ──────────────────────────────────
function getCurrentStats() {
  const s = localStorage.getItem('cw_stats');
  return s ? JSON.parse(s) : null;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────
// Usage: await apiFetch('/auth/login', 'POST', { email, password })
async function apiFetch(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    // Throw the error message from the server
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

// ── Logout helper (callable from any page) ────────────────────────────────
function logout() {
  clearSession();
  window.location.href = 'index.html';
}

// ── Redirect if NOT logged in ─────────────────────────────────────────────
// Call this at the top of any protected page
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ── Toast notification system ─────────────────────────────────────────────
// Usage: showToast('Battle won!', 'success')
// Types: 'success' | 'error' | 'info' | 'gold'
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', gold: '🏆' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3100);
}

// ── Show floating damage text ─────────────────────────────────────────────
// Usage: showDamageText(25, 'monster', event)
function showDamageText(amount, target, e) {
  const el = document.createElement('div');
  el.className = `damage-text damage-to-${target}`;
  el.textContent = target === 'monster' ? `-${amount} ⚔️` : `-${amount} 💔`;

  // Random x offset so multiple texts don't overlap
  const x = (e?.clientX ?? window.innerWidth / 2) + (Math.random() * 40 - 20);
  const y = (e?.clientY ?? window.innerHeight / 2) - 20;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

// ── HP bar color update ───────────────────────────────────────────────────
function updateHpBar(barEl, current, max) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  barEl.style.width = `${pct}%`;
  if (pct > 60)      barEl.style.background = 'var(--hp-high)';
  else if (pct > 30) barEl.style.background = 'var(--hp-mid)';
  else               barEl.style.background = 'var(--hp-low)';
}

// ── Format a date string nicely ───────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Category display name ─────────────────────────────────────────────────
const CATEGORY_NAMES = {
  programming_basics: 'Programming Basics',
  arrays: 'Arrays',
  strings: 'Strings',
  oop: 'OOP',
  dbms: 'DBMS',
  os: 'Operating Systems',
  aptitude: 'Aptitude',
};

// ── Initialize navbar user info ────────────────────────────────────────────
function initNavbar() {
  const user = getCurrentUser();
  const stats = getCurrentStats();
  if (!user) return;

  const avatarEl = document.getElementById('nav-avatar');
  const usernameEl = document.getElementById('nav-username');
  const levelEl = document.getElementById('nav-level');

  if (avatarEl) avatarEl.textContent = user.avatar || '🧙';
  if (usernameEl) usernameEl.textContent = user.username;
  if (levelEl && stats) levelEl.textContent = `Lv.${stats.level}`;
}

// ── Show achievement unlock popup ─────────────────────────────────────────
function showAchievementUnlock(achievement) {
  const el = document.createElement('div');
  el.className = 'achievement-unlock';
  el.innerHTML = `
    <span class="icon">${achievement.icon}</span>
    <div>
      <div class="title">🎉 Achievement Unlocked!</div>
      <div class="name">${achievement.name}</div>
      <div class="desc">${achievement.description}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Particle burst effect ─────────────────────────────────────────────────
function spawnParticles(x, y, color = '#7c3aed', count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / count) * Math.PI * 2;
    const dist = 60 + Math.random() * 60;
    p.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: ${4 + Math.random() * 6}px;
      height: ${4 + Math.random() * 6}px;
      background: ${color};
      --dx: ${Math.cos(angle) * dist}px;
      --dy: ${Math.sin(angle) * dist}px;
      --duration: ${0.5 + Math.random() * 0.5}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}
