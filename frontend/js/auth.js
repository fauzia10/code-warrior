// frontend/js/auth.js
// Handles login and registration form submission.

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const btn      = document.getElementById('login-btn');
  const btnText  = document.getElementById('login-btn-text');
  const spinner  = document.getElementById('login-spinner');

  // Hide previous errors
  errorDiv.style.display = 'none';

  // Basic client-side validation
  if (!email || !password) {
    errorMsg.textContent = 'Please enter your email and password.';
    errorDiv.style.display = 'flex';
    return;
  }

  // Show loading state
  btn.disabled = true;
  btnText.textContent = 'Logging in...';
  spinner.classList.remove('hidden');

  try {
    const data = await apiFetch('/auth/login', 'POST', { email, password });

    // Save session data
    saveSession(data.token, data.user, data.stats);

    showToast(`Welcome back, ${data.user.username}! ⚔️`, 'success');

    // Redirect to game after short delay
    setTimeout(() => { window.location.href = 'game.html'; }, 800);

  } catch (err) {
    errorMsg.textContent = err.message;
    errorDiv.style.display = 'flex';
    btn.disabled = false;
    btnText.textContent = '⚔️ Enter the Arena';
    spinner.classList.add('hidden');
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const avatar   = document.querySelector('.avatar-option.selected')?.dataset.avatar || '🧙';
  const errorDiv = document.getElementById('register-error');
  const errorMsg = document.getElementById('register-error-msg');
  const btn      = document.getElementById('register-btn');
  const btnText  = document.getElementById('register-btn-text');
  const spinner  = document.getElementById('register-spinner');

  errorDiv.style.display = 'none';

  // Validation
  if (!username || !email || !password) {
    errorMsg.textContent = 'All fields are required.';
    errorDiv.style.display = 'flex';
    return;
  }
  if (username.length < 3) {
    errorMsg.textContent = 'Username must be at least 3 characters.';
    errorDiv.style.display = 'flex';
    return;
  }
  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters.';
    errorDiv.style.display = 'flex';
    return;
  }

  btn.disabled = true;
  btnText.textContent = 'Creating account...';
  spinner.classList.remove('hidden');

  try {
    const data = await apiFetch('/auth/register', 'POST', { username, email, password, avatar });

    // Save session
    saveSession(data.token, data.user, null);

    showToast(`Welcome, ${data.user.username}! Your quest begins! 🧙`, 'gold');

    setTimeout(() => { window.location.href = 'game.html'; }, 1000);

  } catch (err) {
    errorMsg.textContent = err.message;
    errorDiv.style.display = 'flex';
    btn.disabled = false;
    btnText.textContent = '🧙 Create Warrior';
    spinner.classList.add('hidden');
  }
}
