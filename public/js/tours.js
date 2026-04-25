// =====================
// ДАНІ ТУРІВ
// =====================

let allTours = [];

// =====================
// ПАГІНАЦІЯ
// =====================

const CARDS_PER_PAGE = 6;
let currentPage = 1;

function totalPages() {
  return Math.ceil(allTours.length / CARDS_PER_PAGE);
}

// =====================
// РЕНДЕР КАРТОК
// =====================

function renderCards(page) {
  const grid = document.getElementById('cards-grid');
  const start = (page - 1) * CARDS_PER_PAGE;
  const pageTours = allTours.slice(start, start + CARDS_PER_PAGE);

  grid.innerHTML = pageTours.map(tour => `
    <div class="card">
      <div class="card-img-wrap">
        <img src="${tour.image}" alt="${tour.title}"
          onerror="this.src='https://placehold.co/400x190/5e8b69/ffffff?text=${encodeURIComponent(tour.title)}'" />
      </div>
      <div class="card-body">
        <h3>${tour.title}</h3>
        <p>${tour.description}</p>
      </div>
      <div class="card-footer">
        <button onclick="${tour.link ? `location.href='${tour.link}'` : `alert('Детальніше про: ${tour.title}')`}">Детальніше</button>
        <div class="price">від <strong>${Number(tour.price).toLocaleString('uk-UA')} грн</strong></div>
      </div>
    </div>
  `).join('');
}

// =====================
// РЕНДЕР ПАГІНАЦІЇ
// =====================

function renderPagination(page) {
  const pagination = document.getElementById('pagination');
  const total = totalPages();

  if (total <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button class="arrow" ${page === 1 ? 'disabled' : ''} onclick="goTo(${page - 1})">&#8249;</button>`;

  for (let i = 1; i <= total; i++) {
    html += `<button class="${i === page ? 'active' : ''}" onclick="goTo(${i})">${i}</button>`;
  }

  html += `<button class="arrow" ${page === total ? 'disabled' : ''} onclick="goTo(${page + 1})">&#8250;</button>`;

  pagination.innerHTML = html;
}

// =====================
// НАВІГАЦІЯ СТОРІНКАМИ
// =====================

function goTo(page) {
  currentPage = page;
  renderCards(page);
  renderPagination(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================
// ЗАВАНТАЖЕННЯ ТУРІВ
// =====================

async function loadTours() {
  try {
    const response = await fetch('/api/tours');
    const data = await response.json();

    allTours = data;
    renderCards(currentPage);
    renderPagination(currentPage);
  } catch (error) {
    console.error('Помилка завантаження турів:', error);
    document.getElementById('cards-grid').innerHTML = '<p>Не вдалося завантажити тури.</p>';
  }
}

// =====================
// ІНІЦІАЛІЗАЦІЯ
// =====================

loadTours();