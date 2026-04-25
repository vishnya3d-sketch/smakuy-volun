function getCurrentUser() {
  const localUser = localStorage.getItem('currentUser');
  const sessionUser = sessionStorage.getItem('currentUser');

  if (localUser) return JSON.parse(localUser);
  if (sessionUser) return JSON.parse(sessionUser);

  return null;
}

const currentUser = getCurrentUser();

if (!currentUser) {
  window.location.href = '/register.html';
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = '/register.html';
  });
}

function renderUserInfo() {
  const userInfo = document.getElementById('user-info');
  const welcomeText = document.getElementById('welcome-text');

  if (!userInfo || !welcomeText) return;

  userInfo.innerHTML = `
    <div class="profile-line"><strong>Ім’я:</strong> ${currentUser.name || '—'}</div>
    <div class="profile-line"><strong>Email:</strong> ${currentUser.email || '—'}</div>
    <div class="profile-line"><strong>Роль:</strong> ${currentUser.role === 'admin' ? 'Адміністратор' : 'Користувач'}</div>
  `;

  welcomeText.textContent = `Вітаємо, ${currentUser.name || 'користувачу'}! Тут зібрані ваші бронювання, статуси заявок і дані профілю.`;
}

function getTourImage(booking) {
  const slug = booking.tour_slug || '';

  const map = {
    'tour-weekend': '/img/tours-weekend.png',
    'tour-cheese': '/img/tours-cheese.png',
    'tour-honey': '/img/tours-honey.png',
    'tour-distillery': '/img/tours-distillery.png',
    'tour-ratne': '/img/tours-ratne.jpg',
    'tour-eco': '/img/tours-eco.jpg',
    'tour-mushroom': '/img/tours-mushroom.jpg',
    'tour-berries': '/img/tours-berries.jpg',
    'tour-cossack': '/img/tours-cossack.jpg'
  };

  return map[slug] || '/img/tours-weekend.png';
}

function formatDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('uk-UA');
}

function updateStats(bookings) {
  const totalEl = document.getElementById('stat-total');
  const newEl = document.getElementById('stat-new');
  const processedEl = document.getElementById('stat-processed');

  if (!totalEl || !newEl || !processedEl) return;

  const total = bookings.length;
  const newCount = bookings.filter(b => b.status !== 'processed').length;
  const processedCount = bookings.filter(b => b.status === 'processed').length;

  totalEl.textContent = total;
  newEl.textContent = newCount;
  processedEl.textContent = processedCount;
}

async function loadMyBookings() {
  const container = document.getElementById('my-bookings-list');
  if (!container) return;

  try {
    const response = await fetch(`/api/my-bookings?email=${encodeURIComponent(currentUser.email)}`);
    const data = await response.json();

    if (!data.success || !Array.isArray(data.bookings) || data.bookings.length === 0) {
      updateStats([]);

      container.innerHTML = `
        <div class="empty-bookings">
          <div class="empty-icon">🧳</div>
          <h3>Поки що тут порожньо</h3>
          <p>Коли ви забронюєте тур, він з’явиться у цьому розділі.</p>
          <a href="/maintours.html" class="browse-btn">Переглянути тури</a>
        </div>
      `;
      return;
    }

    const bookings = data.bookings;
    updateStats(bookings);

    container.innerHTML = `
      <div class="booking-list">
        ${bookings.map(booking => `
          <div class="booking-card">
            <img
              class="booking-image"
              src="${getTourImage(booking)}"
              alt="${booking.tour_title || 'Тур'}"
              onerror="this.src='/img/tours-weekend.png'"
            />

            <div class="booking-body">
              <div class="booking-title">${booking.tour_title || 'Без назви туру'}</div>

              <div class="booking-meta">
                <span class="booking-pill">📅 ${formatDate(booking.booking_date)}</span>
                <span class="booking-pill">👥 ${booking.people_count || '—'}</span>
                <span class="booking-status ${booking.status === 'processed' ? 'processed' : 'new'}">
                  ${booking.status === 'processed' ? 'Оброблено' : 'Нове'}
                </span>
              </div>

              <div class="booking-extra">
                <div><strong>Телефон:</strong> ${booking.phone || '—'}</div>
                <div><strong>Email:</strong> ${booking.email || '—'}</div>
                <div><strong>Коментар:</strong> ${booking.comment || '—'}</div>
              </div>

              <div class="booking-created">
                <strong>Створено:</strong> ${formatDate(booking.created_at)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    updateStats([]);

    container.innerHTML = `
      <div class="empty-bookings">
        <div class="empty-icon">⚠️</div>
        <h3>Не вдалося завантажити бронювання</h3>
        <p>Спробуйте оновити сторінку трохи пізніше.</p>
      </div>
    `;
  }
}

renderUserInfo();
loadMyBookings();