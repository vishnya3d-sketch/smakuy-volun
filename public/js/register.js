// =====================
// ПЕРЕМИКАННЯ ТАБІВ
// =====================

function switchTab(tab) {
  document.getElementById('tab-register').classList.add('hidden');
  document.getElementById('tab-login').classList.add('hidden');
  document.getElementById(`tab-${tab}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[tab === 'register' ? 0 : 1].classList.add('active');
}

// =====================
// ПОКАЗАТИ/СХОВАТИ ПАРОЛЬ
// =====================

function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// =====================
// РЕЄСТРАЦІЯ
// =====================

async function submitRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const agree = document.getElementById('agree').checked;
  const note = document.getElementById('reg-note');
  const btn = document.querySelector('#tab-register .btn-auth');

  if (!name) {
    note.textContent = "Введіть ваше ім'я";
    note.className = 'auth-note error';
    return;
  }

  if (!email || !email.includes('@')) {
    note.textContent = 'Введіть коректний email';
    note.className = 'auth-note error';
    return;
  }

  if (pass.length < 6) {
    note.textContent = 'Пароль має містити мінімум 6 символів';
    note.className = 'auth-note error';
    return;
  }

  if (pass !== pass2) {
    note.textContent = 'Паролі не співпадають';
    note.className = 'auth-note error';
    return;
  }

  if (!agree) {
    note.textContent = 'Погодьтесь з умовами використання';
    note.className = 'auth-note error';
    return;
  }

  try {
    btn.textContent = 'Реєстрація...';
    btn.disabled = true;

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        password: pass,
        role: 'user'
      })
    });

    const data = await response.json();

    if (data.success) {
      note.textContent = `✓ Вітаємо, ${name}! Реєстрація успішна.`;
      note.className = 'auth-note success';

      btn.textContent = '✓ Зареєстровано!';
      btn.style.background = '#388e3c';

      setTimeout(() => {
        switchTab('login');
        document.getElementById('login-email').value = email;
        document.getElementById('login-pass').value = '';

        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-phone').value = '';
        document.getElementById('reg-pass').value = '';
        document.getElementById('reg-pass2').value = '';
        document.getElementById('agree').checked = false;

        note.textContent = '';
        btn.textContent = 'Зареєструватись';
        btn.style.background = '';
        btn.disabled = false;
      }, 1200);
    } else {
      note.textContent = data.message || 'Помилка реєстрації';
      note.className = 'auth-note error';
      btn.textContent = 'Зареєструватись';
      btn.disabled = false;
    }
  } catch (error) {
    note.textContent = 'Помилка з’єднання';
    note.className = 'auth-note error';
    btn.textContent = 'Зареєструватись';
    btn.disabled = false;
  }
}

// =====================
// ВХІД
// =====================

async function submitLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const remember = document.getElementById('remember').checked;
  const note = document.getElementById('login-note');
  const btn = document.querySelector('#tab-login .btn-auth');

  if (!email || !email.includes('@')) {
    note.textContent = 'Введіть коректний email';
    note.className = 'auth-note error';
    return;
  }

  if (!pass) {
    note.textContent = 'Введіть пароль';
    note.className = 'auth-note error';
    return;
  }

  try {
    btn.textContent = 'Вхід...';
    btn.disabled = true;

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: pass
      })
    });

    const data = await response.json();

    if (!data.success) {
      note.textContent = data.message || 'Невірний email або пароль';
      note.className = 'auth-note error';
      btn.textContent = 'Увійти';
      btn.disabled = false;
      return;
    }

    note.textContent = `✓ Вітаємо, ${data.user.name}!`;
    note.className = 'auth-note success';

    btn.textContent = '✓ Вхід виконано!';
    btn.style.background = '#388e3c';

    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('currentUser', JSON.stringify(data.user));

    setTimeout(() => {
      if (data.user.role === 'admin') {
        location.href = '/admin.html';
      } else {
        location.href = '/cabinet.html';
      }
    }, 1200);
  } catch (error) {
    note.textContent = 'Помилка з’єднання';
    note.className = 'auth-note error';
    btn.textContent = 'Увійти';
    btn.disabled = false;
  }
}