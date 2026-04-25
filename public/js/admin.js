let authUser = null;
let placesCache = [];
let bookingsCache = [];

// =====================
// ПЕРЕВІРКА ДОСТУПУ
// =====================

function getCurrentUser() {
  const localUser = localStorage.getItem('currentUser');
  const sessionUser = sessionStorage.getItem('currentUser');

  if (localUser) return JSON.parse(localUser);
  if (sessionUser) return JSON.parse(sessionUser);

  return null;
}

authUser = getCurrentUser();

if (!authUser || authUser.role !== 'admin') {
  window.location.href = '/register.html';
}

// =====================
// ДОПОМІЖНІ ФУНКЦІЇ
// =====================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'error' : ''}`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 2600);
}

function setNote(elementId, message, success) {
  const note = document.getElementById(elementId);
  if (!note) return;

  note.textContent = message;
  note.className = `note ${success ? 'success' : 'error'}`;
}

function safeText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setStat(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

// =====================
// ТАБИ
// =====================

const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
const panels = document.querySelectorAll('.panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
  });
});

// =====================
// ВИХІД
// =====================

document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = '/register.html';
});

// =====================
// ТОЧКИ МАРШРУТУ
// =====================

document.getElementById('add-point-btn')?.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'point-row';
  row.innerHTML = `
    <input type="text" placeholder="Назва точки" class="point-name">
    <input type="number" step="0.0000001" placeholder="lat" class="point-lat">
    <input type="number" step="0.0000001" placeholder="lng" class="point-lng">
    <button type="button" class="remove-point-btn">Видалити</button>
  `;
  document.getElementById('points-container').appendChild(row);
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-point-btn')) {
    const rows = document.querySelectorAll('.point-row');

    if (rows.length > 1) {
      e.target.closest('.point-row').remove();
    } else {
      showToast('Має залишитися хоча б одна точка.', 'error');
    }
  }
});

// =====================
// СТАТИСТИКА
// =====================

async function loadStats() {
  try {
    const [placesResponse, bookingsResponse] = await Promise.all([
      fetch('/api/admin/places'),
      fetch('/api/admin/bookings')
    ]);

    const places = await placesResponse.json();
    const bookings = await bookingsResponse.json();

    setStat('stat-places', Array.isArray(places) ? places.length : 0);
    setStat('stat-bookings', Array.isArray(bookings) ? bookings.length : 0);
  } catch (error) {
    setStat('stat-places', '—');
    setStat('stat-bookings', '—');
  }

  setStat('stat-tours', '—');
  setStat('stat-routes', '—');
}

// =====================
// ДОДАТИ ТУР
// =====================

document.getElementById('tour-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const body = {
    title: document.getElementById('tour-title').value.trim(),
    description: document.getElementById('tour-description').value.trim(),
    price: Number(document.getElementById('tour-price').value),
    image: document.getElementById('tour-image').value.trim(),
    link: document.getElementById('tour-link').value.trim()
  };

  try {
    const response = await fetch('/api/admin/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    setNote('tour-note', data.message, data.success);
    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      e.target.reset();
      loadStats();
    }
  } catch (error) {
    setNote('tour-note', 'Помилка з’єднання', false);
    showToast('Помилка з’єднання', 'error');
  }
});

// =====================
// ДОДАТИ ЗАКЛАД
// =====================

document.getElementById('place-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const latValue = document.getElementById('place-lat').value.trim();
  const lngValue = document.getElementById('place-lng').value.trim();

  const body = {
    title: document.getElementById('place-title').value.trim(),
    description: document.getElementById('place-description').value.trim(),
    image: document.getElementById('place-image').value.trim(),
    category: document.getElementById('place-category').value,
    address: document.getElementById('place-address').value.trim(),
    hours: document.getElementById('place-hours').value.trim(),
    lat: latValue ? parseFloat(latValue) : null,
    lng: lngValue ? parseFloat(lngValue) : null
  };

  try {
    const response = await fetch('/api/admin/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    setNote('place-note', data.message, data.success);
    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      e.target.reset();
      loadPlacesList();
      loadStats();
    }
  } catch (error) {
    setNote('place-note', 'Помилка з’єднання', false);
    showToast('Помилка з’єднання', 'error');
  }
});

// =====================
// СПИСОК ЗАКЛАДІВ
// =====================

function renderPlacesList(items) {
  const container = document.getElementById('places-list');
  if (!container) return;

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<div class="note">Закладів не знайдено.</div>';
    return;
  }

  container.innerHTML = `
    <div class="admin-list">
      ${items.map(place => `
        <div class="admin-item">
          <div>
            <div class="admin-item-title">${safeText(place.title)}</div>
            <div>${safeText(place.category || '')}${place.address ? ' • ' + safeText(place.address) : ''}</div>
            ${place.hours ? `<div><strong>Години:</strong> ${safeText(place.hours)}</div>` : ''}
          </div>
          <button class="delete-btn" onclick="deletePlace(${Number(place.id)})">Видалити</button>
        </div>
      `).join('')}
    </div>
  `;
}

async function loadPlacesList() {
  const container = document.getElementById('places-list');
  if (!container) return;

  try {
    const response = await fetch('/api/admin/places');
    const data = await response.json();

    placesCache = Array.isArray(data) ? data : [];
    renderPlacesList(placesCache);
    setStat('stat-places', placesCache.length);
  } catch (error) {
    container.innerHTML = '<div class="error">Не вдалося завантажити список закладів</div>';
  }
}

document.getElementById('places-search')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();

  const filtered = placesCache.filter(place => {
    return [
      place.title,
      place.category,
      place.address,
      place.hours,
      place.description
    ].some(value => String(value || '').toLowerCase().includes(query));
  });

  renderPlacesList(filtered);
});

async function deletePlace(id) {
  const confirmed = confirm('Точно видалити заклад?');
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/places/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      loadPlacesList();
      loadStats();
    }
  } catch (error) {
    showToast('Помилка з’єднання', 'error');
  }
}

// =====================
// ДОДАТИ МАРШРУТ
// =====================

document.getElementById('route-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const points = [];
  const names = document.querySelectorAll('.point-name');
  const lats = document.querySelectorAll('.point-lat');
  const lngs = document.querySelectorAll('.point-lng');

  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim();
    const lat = parseFloat(lats[i].value);
    const lng = parseFloat(lngs[i].value);

    if (name && !isNaN(lat) && !isNaN(lng)) {
      points.push({ name, lat, lng });
    }
  }

  const body = {
    title: document.getElementById('route-title').value.trim(),
    description: document.getElementById('route-description').value.trim(),
    image: document.getElementById('route-image').value.trim(),
    category: document.getElementById('route-category').value,
    duration: document.getElementById('route-duration').value.trim(),
    distance: document.getElementById('route-distance').value.trim(),
    color: document.getElementById('route-color').value.trim(),
    points
  };

  if (points.length === 0) {
    setNote('route-note', 'Додай хоча б одну точку маршруту', false);
    showToast('Додай хоча б одну точку маршруту', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    setNote('route-note', data.message, data.success);
    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      e.target.reset();

      const pointsContainer = document.getElementById('points-container');
      pointsContainer.innerHTML = `
        <div class="point-row">
          <input type="text" placeholder="Назва точки" class="point-name">
          <input type="number" step="0.0000001" placeholder="lat" class="point-lat">
          <input type="number" step="0.0000001" placeholder="lng" class="point-lng">
          <button type="button" class="remove-point-btn">Видалити</button>
        </div>
        <div class="point-row">
          <input type="text" placeholder="Назва точки" class="point-name">
          <input type="number" step="0.0000001" placeholder="lat" class="point-lat">
          <input type="number" step="0.0000001" placeholder="lng" class="point-lng">
          <button type="button" class="remove-point-btn">Видалити</button>
        </div>
      `;

      loadStats();
    }
  } catch (error) {
    setNote('route-note', 'Помилка з’єднання', false);
    showToast('Помилка з’єднання', 'error');
  }
});

// =====================
// СПИСОК БРОНЮВАНЬ
// =====================

function renderBookingsList(items) {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<div class="note">Бронювань не знайдено.</div>';
    return;
  }

  container.innerHTML = `
    <div class="admin-list">
      ${items.map(booking => `
        <div class="admin-item">
          <div>
            <div class="admin-item-title">${safeText(booking.tour_title || 'Без назви туру')}</div>
            <div><strong>Ім’я:</strong> ${safeText(booking.name || '')}</div>
            <div><strong>Телефон:</strong> ${safeText(booking.phone || '')}</div>
            <div><strong>Email:</strong> ${safeText(booking.email || '')}</div>
            <div><strong>Дата:</strong> ${safeText(booking.booking_date || '')}</div>
            <div><strong>Осіб:</strong> ${safeText(booking.people_count || '')}</div>
            <div><strong>Коментар:</strong> ${safeText(booking.comment || '—')}</div>
            <div>
              <strong>Статус:</strong>
              <span class="booking-status ${booking.status === 'processed' ? 'processed' : 'new'}">
                ${booking.status === 'processed' ? 'Оброблено' : 'Нове'}
              </span>
            </div>
          </div>

          <div class="booking-actions">
            <button class="status-btn" onclick="toggleBookingStatus(${Number(booking.id)}, '${safeText(booking.status || 'new')}')">
              ${booking.status === 'processed' ? 'Позначити як нове' : 'Позначити як оброблено'}
            </button>
            <button class="delete-btn" onclick="deleteBooking(${Number(booking.id)})">Видалити</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function loadBookingsList() {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  try {
    const response = await fetch('/api/admin/bookings');
    const data = await response.json();

    bookingsCache = Array.isArray(data) ? data : [];
    renderBookingsList(bookingsCache);
    setStat('stat-bookings', bookingsCache.length);
  } catch (error) {
    container.innerHTML = '<div class="error">Не вдалося завантажити бронювання</div>';
  }
}

document.getElementById('bookings-search')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();

  const filtered = bookingsCache.filter(booking => {
    return [
      booking.tour_title,
      booking.name,
      booking.phone,
      booking.email,
      booking.booking_date,
      booking.comment,
      booking.status
    ].some(value => String(value || '').toLowerCase().includes(query));
  });

  renderBookingsList(filtered);
});

async function toggleBookingStatus(id, currentStatus) {
  const newStatus = currentStatus === 'processed' ? 'new' : 'processed';

  try {
    const response = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();

    showToast(data.message || 'Статус оновлено', data.success ? 'success' : 'error');

    if (data.success) {
      loadBookingsList();
      loadStats();
    }
  } catch (error) {
    showToast('Помилка з’єднання', 'error');
  }
}

async function deleteBooking(id) {
  const confirmed = confirm('Точно видалити бронювання?');
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      loadBookingsList();
      loadStats();
    }
  } catch (error) {
    showToast('Помилка з’єднання', 'error');
  }
}

// =====================
// СТАРТ
// =====================

loadStats();
loadPlacesList();
loadBookingsList();