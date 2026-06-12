// frontend/js/leaderboard.js
if (!requireAuth()) { /* redirected */ }

const ME = getCurrentUser();

async function initLeaderboard() {
  initNavbar();
  await loadLeaderboard();
}

async function loadLeaderboard() {
  try {
    const data = await apiFetch('/leaderboard');
    const players = data.leaderboard;

    renderPodium(players.slice(0, 3));
    renderTable(players);
  } catch (err) {
    document.getElementById('lb-body').innerHTML =
      `<tr><td colspan="6" class="alert alert-error" style="margin:20px">
        Failed to load leaderboard. Is the server running?
      </td></tr>`;
  }
}

function renderPodium(top3) {
  const podiumEl = document.getElementById('podium');
  if (!top3.length) { podiumEl.innerHTML = ''; return; }

  // Podium order: 2nd, 1st, 3rd (visual layout)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const rankLabels  = [2, 1, 3];
  const crowns      = ['🥈', '👑', '🥉'];
  const podiumClass = ['podium-2', 'podium-1', 'podium-3'];

  podiumEl.innerHTML = order.map((p, i) => {
    if (!p) return '';
    const rank = rankLabels[i];
    return `
      <div class="podium-slot ${podiumClass[i]}">
        <div class="podium-avatar">
          <span class="crown">${crowns[i]}</span>
          ${p.avatar || '🧙'}
        </div>
        <div class="podium-name">${p.username}</div>
        <div class="podium-level">Lv.${p.level} · ${p.xp} XP</div>
        <div class="podium-base">
          <div class="podium-rank">${rank}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTable(players) {
  const tbody = document.getElementById('lb-body');

  if (!players.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-dim text-center" style="padding:40px">
      No warriors yet. Be the first to battle! ⚔️
    </td></tr>`;
    return;
  }

  tbody.innerHTML = players.map((p, i) => {
    const isMe = ME && p.id === ME.id;
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';

    return `
      <tr class="${isMe ? 'my-row' : ''} leaderboard-row-enter" style="animation-delay:${i * 0.04}s">
        <td><span class="lb-rank ${rankClass}">${i + 1}</span></td>
        <td>
          <div class="lb-player">
            <div class="lb-avatar">${p.avatar || '🧙'}</div>
            <div>
              <div class="lb-name">${p.username}</div>
            </div>
          </div>
        </td>
        <td><span class="lb-level">⭐ ${p.level}</span></td>
        <td class="text-primary">${p.xp.toLocaleString()} XP</td>
        <td class="text-green">👾 ${p.monsters_defeated}</td>
        <td class="text-dim">✅ ${p.correct_answers}</td>
      </tr>
    `;
  }).join('');
}

initLeaderboard();
