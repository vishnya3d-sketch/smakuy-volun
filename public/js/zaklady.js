let allPlaces = [];
let map;

// =====================
// ЗАВАНТАЖЕННЯ ДАНИХ
// =====================

async function loadPlaces() {
  try {
    const response = await fetch('/api/places');
    const data = await response.json();

    console.log('DATA FROM API:', data);

    allPlaces = data;
    renderPlaces(allPlaces);
    initFilters();
    initMap();
  } catch (error) {
    console.error('Помилка завантаження:', error);
  }
}

// =====================
// РЕНДЕР КАРТОК (БЕЗ КНОПКИ)
// =====================

function renderPlaces(places) {
  const grid = document.getElementById('places-grid');
  if (!grid) return;

  grid.innerHTML = places.map(place => `
      <div class="place-card"
        data-category="${normalizeCategory(place.category)}">

      <img src="${place.image}" alt="${place.title}"
        onerror="this.src='https://placehold.co/400x240/5e8b69/ffffff?text=${encodeURIComponent(place.title)}'" />

      <div class="place-body">

        <div class="place-tag ${normalizeCategory(place.category)}">
          ${place.category || ''}
        </div>

        <h3>${place.title}</h3>

        <p>${place.description || ''}</p>

        <div class="place-info">
          <span>📍 ${place.address || ''}</span>
          <span>⏰ ${place.hours || ''}</span>
        </div>

      </div>
    </div>
  `).join('');
}

// =====================
// НОРМАЛІЗАЦІЯ КАТЕГОРІЙ
// =====================

function normalizeCategory(category) {
  if (!category) return 'all';

  const c = category.toLowerCase();

  if (c.includes('ресторан')) return 'restaurant';
  if (c.includes('кафе')) return 'cafe';
  if (c.includes('ферма')) return 'farm';
  if (c.includes('еко')) return 'eco';

  return 'all';
}

// =====================
// ФІЛЬТР
// =====================

function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll('.place-card');

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// =====================
// КАРТА
// =====================

function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  map = L.map('map').setView([50.7472, 25.3254], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);

  const greenIcon = L.divIcon({
    className: '',
    html: `<div style="
      background: #2e7d32;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36]
  });

  allPlaces.forEach(place => {
    if (place.lat && place.lng) {
      const marker = L.marker([place.lat, place.lng], { icon: greenIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Nunito', sans-serif;">
          <strong>${place.title}</strong><br/>
          ${place.category || ''}<br/>
          📍 ${place.address || ''}<br/>
          ⏰ ${place.hours || ''}
        </div>
      `);
    }
  });
}

// =====================
// СТАРТ
// =====================

loadPlaces();