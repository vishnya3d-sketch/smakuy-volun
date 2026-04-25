// =====================
// AUTH UI
// =====================

function getCurrentUser() {
  const localUser = localStorage.getItem('currentUser');
  const sessionUser = sessionStorage.getItem('currentUser');

  if (localUser) return JSON.parse(localUser);
  if (sessionUser) return JSON.parse(sessionUser);

  return null;
}

function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = '/pages/index.html';
}

const userIconSvg = `
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g transform="translate(0,512) scale(0.1,-0.1)" fill="currentColor" stroke="none">
      <path d="M2410 4469 c-135 -24 -286 -85 -397 -160 -82 -55 -224 -208 -274 -295 -102 -175 -133 -293 -133 -494 0 -160 12 -226 65 -359 94 -235 302 -441 540 -535 124 -48 193 -60 349 -60 119 0 160 4 230 23 187 50 309 120 445 256 136 136 206 257 257 445 32 118 32 336 0 457 -47 180 -126 320 -256 449 -128 128 -270 210 -445 255 -89 23 -297 33 -381 18z m285 -324 c113 -23 227 -87 316 -176 251 -249 251 -647 -1 -899 -252 -252 -650 -252 -899 -1 -200 200 -246 487 -121 737 132 262 417 399 705 339z"/>
      <path d="M1770 2385 c-337 -69 -587 -329 -640 -665 -8 -52 -10 -215 -8 -527 3 -438 4 -452 24 -479 11 -15 33 -37 48 -48 27 -21 30 -21 1366 -21 1336 0 1339 0 1366 21 15 11 37 33 48 48 21 27 21 38 21 519 0 529 1 521 -55 669 -29 77 -104 191 -175 261 -68 70 -184 148 -263 177 -152 57 -106 54 -917 56 -592 2 -764 0 -815 -11z m1545 -320 c178 -47 321 -197 355 -374 5 -30 10 -204 10 -392 l0 -339 -1120 0 -1120 0 0 348 c0 276 3 360 15 405 45 171 177 306 346 351 83 22 1429 23 1514 1z"/>
    </g>
  </svg>
`;

function renderAuthLinks() {
  const container = document.getElementById('auth-links');
  if (!container) return;

  const user = getCurrentUser();

  if (!user) {
    container.innerHTML = `
      <a href="/register.html" class="user-btn" title="Увійти" aria-label="Увійти">
        ${userIconSvg}
      </a>
    `;
    return;
  }

  const isOnCabinet = window.location.pathname.includes('cabinet');

  let html = `
    <a href="/cabinet.html" class="user-btn${isOnCabinet ? ' on-cabinet' : ''}" title="Кабінет">
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(0,512) scale(0.1,-0.1)" fill="rgba(255,255,255,0.9)" stroke="none">
          <path d="M2410 4469 c-135 -24 -286 -85 -397 -160 -82 -55 -224 -208 -274 -295 -102 -175 -133 -293 -133 -494 0 -160 12 -226 65 -359 94 -235 302 -441 540 -535 124 -48 193 -60 349 -60 119 0 160 4 230 23 187 50 309 120 445 256 136 136 206 257 257 445 32 118 32 336 0 457 -47 180 -126 320 -256 449 -128 128 -270 210 -445 255 -89 23 -297 33 -381 18z m285 -324 c113 -23 227 -87 316 -176 251 -249 251 -647 -1 -899 -252 -252 -650 -252 -899 -1 -200 200 -246 487 -121 737 132 262 417 399 705 339z"/>
          <path d="M1770 2385 c-337 -69 -587 -329 -640 -665 -8 -52 -10 -215 -8 -527 3 -438 4 -452 24 -479 11 -15 33 -37 48 -48 27 -21 30 -21 1366 -21 1336 0 1339 0 1366 21 15 11 37 33 48 48 21 27 21 38 21 519 0 529 1 521 -55 669 -29 77 -104 191 -175 261 -68 70 -184 148 -263 177 -152 57 -106 54 -917 56 -592 2 -764 0 -815 -11z m1545 -320 c178 -47 321 -197 355 -374 5 -30 10 -204 10 -392 l0 -339 -1120 0 -1120 0 0 348 c0 276 3 360 15 405 45 171 177 306 346 351 83 22 1429 23 1514 1z"/>
        </g>
      </svg>
    </a>
  `;

  if (user.role === 'admin') {
    html += `<a href="/admin.html" title="Адмінка">Адмінка</a>`;
  }

  container.innerHTML = html;

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

renderAuthLinks();