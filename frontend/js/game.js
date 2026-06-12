// frontend/js/game.js
// The complete battle engine — handles monster selection, questions, answers, and results.

// ── Guard: redirect to login if not authenticated ──────────────────────────
if (!requireAuth()) { /* redirected */ }

// ── State variables ────────────────────────────────────────────────────────
// These hold the current battle state while a fight is in progress.
const state = {
  monster: null,           // Current monster object
  currentQuestion: null,   // Current question object
  playerHp: 100,           // Player's current HP
  playerMaxHp: 100,        // Player's max HP
  monsterHp: 0,            // Monster's current HP
  monsterMaxHp: 0,         // Monster's starting HP
  questionsAnswered: 0,    // Counter
  correctCount: 0,         // Correct answers in this battle
  xpGained: 0,             // XP accumulated in this battle
  streak: 0,               // Current streak
  answered: false,         // Has the player answered the current question?
  allMonsters: [],         // Cache of all monsters
};

// ── Initialize page ─────────────────────────────────────────────────────────
async function initGame() {
  initNavbar();
  await loadPlayerStats();
  await loadMonsters();
}

// ── Load and display player stats in the selection screen ──────────────────
async function loadPlayerStats() {
  try {
    const data = await apiFetch('/auth/me');
    const { user, stats } = data;

    // Update localStorage with fresh data
    saveSession(getToken(), user, stats);

    // Update navbar
    document.getElementById('nav-avatar').textContent = user.avatar;
    document.getElementById('nav-username').textContent = user.username;
    if (document.getElementById('nav-level'))
      document.getElementById('nav-level').textContent = `Lv.${stats.level}`;

    // Update player stats panel
    const xpNeeded = stats.level * 100;
    const xpPct = Math.min(100, (stats.xp / xpNeeded) * 100);

    document.getElementById('select-hp-val').textContent  = `${stats.hp}/${stats.max_hp}`;
    document.getElementById('select-xp-val').textContent  = `${stats.xp}/${xpNeeded}`;
    document.getElementById('sel-level').textContent      = stats.level;
    document.getElementById('sel-coins').textContent      = stats.coins;
    document.getElementById('sel-defeated').textContent   = stats.monsters_defeated;
    document.getElementById('sel-streak').textContent     = stats.best_streak;

    updateHpBar(document.getElementById('select-hp-bar'), stats.hp, stats.max_hp);
    document.getElementById('select-xp-bar').style.width = `${xpPct}%`;

    // Store for battle use
    state.playerHp    = stats.hp;
    state.playerMaxHp = stats.max_hp;

  } catch (err) {
    console.error('Failed to load player stats:', err);
  }
}

// ── Load monsters from API ──────────────────────────────────────────────────
async function loadMonsters() {
  try {
    const data = await apiFetch('/game/monsters');
    state.allMonsters = data.monsters;
    renderMonsters(data.monsters);
  } catch (err) {
    document.getElementById('monsters-grid').innerHTML =
      `<div style="grid-column:1/-1" class="alert alert-error">Failed to load monsters. Is the server running?</div>`;
  }
}

// ── Render monster cards ────────────────────────────────────────────────────
function renderMonsters(monsters) {
  const grid = document.getElementById('monsters-grid');

  if (!monsters.length) {
    grid.innerHTML = `<div class="text-dim text-center" style="grid-column:1/-1;padding:var(--space-xl)">
      No monsters available for your level yet. Keep leveling up!
    </div>`;
    return;
  }

  grid.innerHTML = monsters.map(m => `
    <div class="monster-card" id="mc-${m.id}" data-category="${m.category}"
         onclick="startBattle(${m.id})">
      <div class="monster-level-badge">Lv.${m.level_required}+</div>
      <div class="monster-emoji">${m.image_emoji}</div>
      <div class="monster-name">${m.name}</div>
      <div class="monster-category">${CATEGORY_NAMES[m.category] || m.category}</div>
      <div class="monster-stats">
        <span>💀 ${m.hp} HP</span> ·
        <span>⚡ ${m.xp_reward} XP</span> ·
        <span>💰 ${m.coin_reward}</span>
      </div>
      <div class="monster-desc">${m.description}</div>
      <div class="fight-btn">⚔️ Fight!</div>
    </div>
  `).join('');
}

// ── Filter monsters by category ─────────────────────────────────────────────
function filterMonsters(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (category === 'all') {
    renderMonsters(state.allMonsters);
  } else {
    renderMonsters(state.allMonsters.filter(m => m.category === category));
  }
}

// ── Start a battle ──────────────────────────────────────────────────────────
async function startBattle(monsterId) {
  try {
    const data = await apiFetch('/game/battle/start', 'POST', { monsterId });

    state.monster      = data.monster;
    state.monsterHp    = data.monster.hp;
    state.monsterMaxHp = data.monster.hp;
    state.playerHp     = data.playerHp;
    state.playerMaxHp  = data.playerMaxHp;
    state.questionsAnswered = 0;
    state.correctCount      = 0;
    state.xpGained          = 0;
    state.streak            = 0;
    state.answered          = false;

    // Show battle screen
    showScreen('screen-battle');
    setupBattleHud(data);
    loadQuestion(data.question);

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Setup the battle HUD with monster/player data ───────────────────────────
function setupBattleHud(data) {
  const user  = getCurrentUser();
  const m     = data.monster;

  // Player side
  document.getElementById('battle-player-avatar').textContent = user.avatar || '🧙';
  document.getElementById('battle-player-name').textContent   = user.username;
  document.getElementById('battle-player-hp-text').textContent = `${state.playerHp}/${state.playerMaxHp}`;
  updateHpBar(document.getElementById('battle-player-hp-bar'), state.playerHp, state.playerMaxHp);

  // Monster side
  document.getElementById('battle-monster-name-hud').textContent = m.name;
  document.getElementById('battle-monster-hp-text').textContent   = `${m.hp}/${m.hp}`;
  updateHpBar(document.getElementById('battle-monster-hp-bar'), m.hp, m.hp);

  // Monster display
  const emojiEl = document.getElementById('battle-monster-emoji');
  emojiEl.textContent = m.image_emoji;
  emojiEl.className = 'battle-monster-emoji monster-appear';
  setTimeout(() => emojiEl.classList.add('monster-float'), 800);
  document.getElementById('battle-monster-name').textContent  = m.name;
  document.getElementById('battle-category-badge').textContent = CATEGORY_NAMES[m.category] || m.category;

  // Bottom bar
  document.getElementById('battle-streak').textContent = '0';
  document.getElementById('battle-coins').textContent  = getCurrentStats()?.coins || 0;
}

// ── Load a question into the UI ─────────────────────────────────────────────
function loadQuestion(q) {
  state.currentQuestion = q;
  state.answered = false;

  document.getElementById('question-num').textContent = `Question ${state.questionsAnswered + 1}`;
  document.getElementById('question-text').textContent = q.question_text;
  document.getElementById('opt-a').textContent = q.option_a;
  document.getElementById('opt-b').textContent = q.option_b;
  document.getElementById('opt-c').textContent = q.option_c;
  document.getElementById('opt-d').textContent = q.option_d;

  // Set difficulty badge
  const diffBadge = document.getElementById('question-difficulty-badge');
  diffBadge.textContent = q.difficulty;
  diffBadge.className = `badge badge-${q.difficulty}`;

  // Reset button states
  ['a','b','c','d'].forEach(letter => {
    const btn = document.getElementById(`btn-${letter}`);
    btn.className = 'answer-btn';
    btn.disabled = false;
  });

  // Hide explanation + next btn
  document.getElementById('explanation-box').classList.remove('show');
  document.getElementById('next-question-btn').classList.remove('show');

  // Add entrance animation
  document.querySelector('.question-area').classList.add('question-slide-in');
  setTimeout(() => document.querySelector('.question-area').classList.remove('question-slide-in'), 400);

  // Update counters
  document.getElementById('questions-answered').textContent = state.questionsAnswered;
  document.getElementById('correct-count').textContent      = state.correctCount;
}

// ── Handle answer selection ─────────────────────────────────────────────────
async function selectAnswer(letter) {
  if (state.answered) return; // Prevent double-answering
  state.answered = true;

  // Disable all buttons
  ['a','b','c','d'].forEach(l => { document.getElementById(`btn-${l}`).disabled = true; });

  try {
    const data = await apiFetch('/game/battle/answer', 'POST', {
      questionId: state.currentQuestion.id,
      selectedOption: letter,
      currentMonsterHp: state.monsterHp,
      currentPlayerHp: state.playerHp,
      monsterId: state.monster.id,
    });

    state.questionsAnswered++;
    state.monsterHp = data.newMonsterHp;
    state.playerHp  = data.newPlayerHp;
    state.streak    = data.streak;

    if (data.isCorrect) {
      state.correctCount++;
      state.xpGained += state.currentQuestion.difficulty === 'hard' ? 30
                      : state.currentQuestion.difficulty === 'medium' ? 20 : 10;

      // Visual feedback: correct
      document.getElementById(`btn-${letter}`).classList.add('correct');
      document.getElementById('monster-display').classList.add('correct-glow');
      showDamageText(data.damage, 'monster', null);
      spawnParticles(
        document.getElementById('battle-monster-emoji').getBoundingClientRect().left + 50,
        document.getElementById('battle-monster-emoji').getBoundingClientRect().top + 50,
        '#10b981', 10
      );
      setTimeout(() => document.getElementById('monster-display').classList.remove('correct-glow'), 700);

      // Monster shake
      const emojiEl = document.getElementById('battle-monster-emoji');
      emojiEl.classList.add('shake');
      setTimeout(() => emojiEl.classList.remove('shake'), 600);

      showToast(`Correct! -${data.damage} monster HP 🗡️`, 'success');

    } else {
      // Wrong: show which was correct, highlight player taking damage
      document.getElementById(`btn-${letter}`).classList.add('wrong');
      document.getElementById(`btn-${data.correctOption}`).classList.add('revealed-correct');
      document.querySelector('.battle-arena').classList.add('hurt-flash');
      showDamageText(data.damage, 'player', null);
      setTimeout(() => document.querySelector('.battle-arena').classList.remove('hurt-flash'), 600);

      showToast(`Wrong! -${data.damage} HP 💔`, 'error');
    }

    // Update streak display
    document.getElementById('battle-streak').textContent = data.streak;
    if (data.streak >= 3) {
      document.getElementById('battle-streak').classList.add('streak-fire');
      setTimeout(() => document.getElementById('battle-streak').classList.remove('streak-fire'), 500);
    }

    // Update HP bars
    updateHpBar(document.getElementById('battle-player-hp-bar'), state.playerHp, state.playerMaxHp);
    updateHpBar(document.getElementById('battle-monster-hp-bar'), state.monsterHp, state.monsterMaxHp);
    document.getElementById('battle-player-hp-text').textContent  = `${state.playerHp}/${state.playerMaxHp}`;
    document.getElementById('battle-monster-hp-text').textContent = `${state.monsterHp}/${state.monsterMaxHp}`;
    document.getElementById('questions-answered').textContent = state.questionsAnswered;
    document.getElementById('correct-count').textContent      = state.correctCount;

    // Show explanation
    const expBox = document.getElementById('explanation-box');
    expBox.innerHTML = `<strong>💡 Explanation:</strong> ${data.explanation}`;
    expBox.classList.add('show');

    // Check battle outcome
    if (state.monsterHp <= 0) {
      // Monster defeated!
      const emojiEl = document.getElementById('battle-monster-emoji');
      emojiEl.classList.remove('monster-float');
      emojiEl.classList.add('monster-die');
      setTimeout(() => endBattle('win'), 900);
    } else if (state.playerHp <= 0) {
      // Player defeated
      setTimeout(() => endBattle('loss'), 900);
    } else {
      // Continue: show next question button
      document.getElementById('next-question-btn').classList.add('show');

      // Auto-load if next question available
      if (data.nextQuestion) {
        state._nextQuestion = data.nextQuestion;
      }
    }

  } catch (err) {
    showToast(err.message, 'error');
    state.answered = false;
    ['a','b','c','d'].forEach(l => { document.getElementById(`btn-${l}`).disabled = false; });
  }
}

// ── Load next question ──────────────────────────────────────────────────────
async function loadNextQuestion() {
  if (state._nextQuestion) {
    loadQuestion(state._nextQuestion);
    state._nextQuestion = null;
  } else {
    // Fetch a new question if none pre-fetched
    try {
      const data = await apiFetch('/game/battle/start', 'POST', { monsterId: state.monster.id });
      loadQuestion(data.question);
    } catch(e) {
      showToast('Failed to get next question', 'error');
    }
  }
}

// ── End battle and show results ─────────────────────────────────────────────
async function endBattle(outcome) {
  try {
    const data = await apiFetch('/game/battle/end', 'POST', {
      monsterId:         state.monster.id,
      outcome,
      questionsAnswered: state.questionsAnswered,
      correctCount:      state.correctCount,
      xpGained:          state.xpGained,
    });

    // Show achievement unlocks
    if (data.newAchievements?.length) {
      data.newAchievements.forEach((a, i) => {
        setTimeout(() => showAchievementUnlock(a), i * 1500);
      });
    }

    // Show level-up banner
    if (data.leveledUp) {
      const banner = document.createElement('div');
      banner.className = 'levelup-banner';
      banner.innerHTML = `<h2>LEVEL UP!</h2><p>You reached Level ${data.newLevel}! +10 Max HP 🎉</p>`;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 2600);
    }

    // Show result overlay
    showBattleResult(outcome, data);

    // Update cached stats
    const user = getCurrentUser();
    const freshStats = await apiFetch('/auth/me');
    saveSession(getToken(), freshStats.user, freshStats.stats);

  } catch (err) {
    showToast('Failed to save battle results: ' + err.message, 'error');
    returnToArena();
  }
}

// ── Show battle result modal ─────────────────────────────────────────────────
function showBattleResult(outcome, data) {
  const overlay = document.createElement('div');
  overlay.className = 'battle-result-overlay';

  const isWin = outcome === 'win';
  overlay.innerHTML = `
    <div class="battle-result-card ${outcome}">
      <div class="battle-result-emoji">${isWin ? '🏆' : '💀'}</div>
      <h2 style="margin-top:16px; color: ${isWin ? 'var(--color-gold)' : 'var(--color-red)'}">
        ${isWin ? 'VICTORY!' : 'DEFEATED'}
      </h2>
      <p class="text-dim" style="margin-top:8px">${isWin ? `You slew ${state.monster.name}!` : `${state.monster.name} was too powerful...`}</p>

      <div class="stat-grid mt-lg" style="grid-template-columns: repeat(3,1fr)">
        <div class="stat-card"><div class="stat-value text-gold">${data.xpGained}</div><div class="stat-label">XP Earned</div></div>
        <div class="stat-card"><div class="stat-value text-green">${data.coinsEarned}</div><div class="stat-label">💰 Coins</div></div>
        <div class="stat-card"><div class="stat-value">${state.correctCount}/${state.questionsAnswered}</div><div class="stat-label">Correct</div></div>
      </div>

      ${data.leveledUp ? `<div class="alert alert-success mt-md">⭐ Level Up! Now Level ${data.newLevel}</div>` : ''}

      <div class="flex gap-md mt-lg" style="justify-content:center">
        <button class="btn btn-primary" onclick="this.closest('.battle-result-overlay').remove(); returnToArena()">
          ⚔️ Fight Again
        </button>
        <button class="btn btn-outline" onclick="this.closest('.battle-result-overlay').remove(); window.location.href='profile.html'">
          👤 View Profile
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ── Flee from battle ────────────────────────────────────────────────────────
async function fleeBattle() {
  if (confirm('Are you sure you want to flee? Progress in this battle will be lost.')) {
    // End as a loss without saving much
    try {
      await apiFetch('/game/battle/end', 'POST', {
        monsterId: state.monster?.id,
        outcome: 'loss',
        questionsAnswered: state.questionsAnswered,
        correctCount: state.correctCount,
        xpGained: 0,
      });
    } catch(e) {}
    returnToArena();
  }
}

// ── Return to monster selection ─────────────────────────────────────────────
async function returnToArena() {
  showScreen('screen-select');
  await loadPlayerStats();
  await loadMonsters();
}

// ── Show/hide screens ───────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Start ────────────────────────────────────────────────────────────────────
initGame();
