// frontend/js/profile.js
if (!requireAuth()) { /* redirected */ }

const currentUser  = getCurrentUser();
const currentStats = getCurrentStats();

async function initProfile() {
  initNavbar();
  await loadProfile();
  await loadAchievements();
  await loadHistory();
}

async function loadProfile() {
  try {
    const userId = currentUser.id;
    const [profileData, meData] = await Promise.all([
      apiFetch(`/profile/${userId}`),
      apiFetch('/auth/me'),
    ]);

    const { user, stats, winRate } = profileData;

    // Avatar & name
    document.getElementById('profile-avatar').textContent   = user.avatar || '🧙';
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent    = user.email;
    document.getElementById('profile-joined').textContent   = formatDate(user.created_at);
    document.getElementById('profile-level').textContent    = stats.level;

    // XP bar
    const xpNeeded = stats.level * 100;
    const xpPct    = Math.min(100, (stats.xp / xpNeeded) * 100);
    document.getElementById('profile-xp-label').textContent = `${stats.xp} / ${xpNeeded} XP`;
    document.getElementById('profile-xp-bar').style.width  = `${xpPct}%`;

    // Stat cards
    document.getElementById('stat-coins').textContent    = stats.coins;
    document.getElementById('stat-defeated').textContent = stats.monsters_defeated;
    document.getElementById('stat-battles').textContent  = stats.total_battles;
    document.getElementById('stat-winrate').textContent  = `${winRate}%`;
    document.getElementById('stat-correct').textContent  = stats.correct_answers;
    document.getElementById('stat-wrong').textContent    = stats.wrong_answers;
    document.getElementById('stat-streak').textContent   = stats.best_streak;
    document.getElementById('stat-hp').textContent       = `${stats.hp}/${stats.max_hp}`;

    // Navbar avatar
    document.getElementById('nav-avatar').textContent   = user.avatar;
    document.getElementById('nav-username').textContent = user.username;

  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

async function loadAchievements() {
  try {
    const data = await apiFetch('/profile/achievements');
    const grid = document.getElementById('achievements-grid');

    grid.innerHTML = data.achievements.map(a => `
      <div class="achievement-badge ${a.earned ? 'earned' : 'locked'}" title="${a.description}">
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.description}</div>
        ${a.earned ? `<div style="font-size:0.7rem;color:var(--color-gold);margin-top:4px">✅ Earned</div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('achievements-grid').innerHTML =
      '<div class="text-dim text-center">Failed to load achievements.</div>';
  }
}

async function loadHistory() {
  try {
    const data = await apiFetch('/profile/history');
    const tbody = document.getElementById('history-body');

    if (!data.history.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-dim text-center" style="padding:30px">
        No battles yet. Go fight some monsters! ⚔️
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.history.map((h, i) => `
      <tr class="leaderboard-row-enter" style="animation-delay:${i * 0.05}s">
        <td>${h.monster_emoji} ${h.monster_name}</td>
        <td class="outcome-${h.outcome}">${h.outcome === 'win' ? '🏆 WIN' : '💀 LOSS'}</td>
        <td>${h.correct_count} / ${h.questions_answered}</td>
        <td class="text-gold">+${h.xp_gained} XP</td>
        <td class="text-dim">${formatDate(h.played_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('history-body').innerHTML =
      '<tr><td colspan="5" class="text-dim text-center">Failed to load history.</td></tr>';
  }
}

// ── Avatar picker ──────────────────────────────────────────────────────────
function openAvatarModal() {
  document.getElementById('avatar-modal').classList.add('open');
}
function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('open');
}
function closeAvatarModalOutside(e) {
  if (e.target.id === 'avatar-modal') closeAvatarModal();
}

async function pickAvatar(avatar) {
  try {
    await apiFetch('/profile/avatar', 'PUT', { avatar });

    // Update localStorage
    const user = getCurrentUser();
    user.avatar = avatar;
    localStorage.setItem('cw_user', JSON.stringify(user));

    document.getElementById('profile-avatar').textContent = avatar;
    document.getElementById('nav-avatar').textContent = avatar;
    closeAvatarModal();
    showToast('Avatar updated! Looking great, warrior!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

initProfile();
