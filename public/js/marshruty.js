let allRoutes = [];
let routesMap = {};
let map;
let currentLayer = null;
let currentMarkers = [];

// =====================
// ЗАВАНТАЖЕННЯ МАРШРУТІВ
// =====================

async function loadRoutes() {
  try {
    const response = await fetch('/api/routes');
    const data = await response.json();

    allRoutes = data;
    routesMap = {};

    data.forEach(route => {
      routesMap[route.id] = route;
    });

    renderRoutes(allRoutes);
    initFilters();
    initMap();
  } catch (error) {
    console.error('Помилка завантаження маршрутів:', error);
  }
}

// =====================
// РЕНДЕР КАРТОК
// =====================

function renderRoutes(routes) {
  const grid = document.getElementById('routes-grid');
  if (!grid) return;

  grid.innerHTML = routes.map(route => `
    <div class="route-card" data-category="${route.category}" data-route="${route.id}">
      <img src="${route.image}" alt="${route.title}"
        onerror="this.src='https://placehold.co/400x220/5e8b69/ffffff?text=${encodeURIComponent(route.title)}'" />
      <div class="route-body">
        <div class="route-tags">
          <span class="route-tag ${route.category}">${getCategoryLabel(route.category)}</span>
          <span class="route-tag duration">⏱ ${route.duration || ''}</span>
          <span class="route-tag distance">📏 ${route.distance || ''}</span>
        </div>
        <h3>${route.title}</h3>
        <p>${route.description || ''}</p>
        <div class="route-stops">
          ${route.points.map(point => `<div class="stop">${point.name}</div>`).join('')}
        </div>
        <div class="route-actions">
          <button class="btn-map" onclick="showRoute(${route.id})">Показати на карті</button>
          <button class="btn-download" onclick="downloadRoute(${route.id})">⬇ Завантажити</button>
        </div>
      </div>
    </div>
  `).join('');
}

function getCategoryLabel(category) {
  if (category === 'pishyi') return '🚶 Піший';
  if (category === 'velo') return '🚴 Вело';
  if (category === 'avto') return '🚗 Авто';
  return category || '';
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
      const routeCards = document.querySelectorAll('.route-card');

      routeCards.forEach(card => {
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
// LEAFLET КАРТА
// =====================

function initMap() {
  map = L.map('map').setView([50.7472, 25.3254], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);
}

// =====================
// ПОКАЗАТИ МАРШРУТ
// =====================

function showRoute(id) {
  const route = routesMap[id];
  if (!route) return;

  if (currentLayer) map.removeLayer(currentLayer);
  currentMarkers.forEach(m => map.removeLayer(m));
  currentMarkers = [];

  document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active-route'));

  const activeCard = document.querySelector(`[data-route="${id}"]`);
  if (activeCard) {
    activeCard.classList.add('active-route');
  }

  const latlngs = route.points.map(p => [p.lat, p.lng]);

  currentLayer = L.polyline(latlngs, {
    color: route.color || '#2e7d32',
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 4'
  }).addTo(map);

  route.points.forEach((point, index) => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background: ${route.color || '#2e7d32'};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([point.lat, point.lng], { icon })
      .addTo(map)
      .bindPopup(`<strong>${point.name}</strong>`);

    currentMarkers.push(marker);
  });

  map.fitBounds(currentLayer.getBounds(), { padding: [40, 40] });

  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
}

// =====================
// ЗАВАНТАЖИТИ МАРШРУТ
// =====================

function downloadRoute(id) {
  const route = routesMap[id];
  if (!route) return;

  const gpxPoints = route.points.map(p =>
    `  <wpt lat="${p.lat}" lon="${p.lng}"><name>${p.name}</name></wpt>`
  ).join('\n');

  const gpxTrack = route.points.map(p =>
    `      <trkpt lat="${p.lat}" lon="${p.lng}"/>`
  ).join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Смакуй Волинь">
  <metadata><name>${route.title}</name></metadata>
${gpxPoints}
  <trk>
    <name>${route.title}</name>
    <trkseg>
${gpxTrack}
    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `route-${id}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}

loadRoutes();