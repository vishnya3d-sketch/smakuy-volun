// =====================
// ФОРМА ЗВОРОТНОГО ЗВ'ЯЗКУ
// =====================

async function sendForm() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const topic = document.getElementById('topic').value.trim();
  const message = document.getElementById('message').value.trim();
  const note = document.getElementById('form-note');
  const btn = document.querySelector('.btn-send');

  // Валідація
  if (!name) {
    note.textContent = "Будь ласка, введіть ваше ім'я";
    note.className = 'form-note error';
    return;
  }

  if (!email || !email.includes('@')) {
    note.textContent = 'Будь ласка, введіть коректний email';
    note.className = 'form-note error';
    return;
  }

  if (!message) {
    note.textContent = 'Будь ласка, напишіть повідомлення';
    note.className = 'form-note error';
    return;
  }

  try {
    btn.textContent = 'Надсилання...';
    btn.disabled = true;

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, phone, email, topic, message })
    });

    const data = await response.json();

    if (data.success) {
      btn.textContent = '✓ Надіслано!';
      btn.style.background = '#388e3c';

      note.textContent = "Дякуємо! Ми зв'яжемося з вами протягом 24 годин.";
      note.className = 'form-note success';

      document.getElementById('name').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('email').value = '';
      document.getElementById('topic').value = '';
      document.getElementById('message').value = '';
    } else {
      note.textContent = data.message || 'Помилка надсилання';
      note.className = 'form-note error';
      btn.textContent = 'Надіслати повідомлення';
      btn.disabled = false;
    }
  } catch (error) {
    console.error('Помилка:', error);
    note.textContent = 'Помилка з’єднання із сервером';
    note.className = 'form-note error';
    btn.textContent = 'Надіслати повідомлення';
    btn.disabled = false;
  }
}
// =====================
// КАРТА
// =====================

const officeLocation = [51.209018, 24.698025];

const map = L.map('map').setView(officeLocation, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

// кастомний маркер
const officeIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #2e7d32;
    width: 40px;
    height: 40px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -44]
});

L.marker(officeLocation, { icon: officeIcon })
  .addTo(map)
  .bindPopup(`
    <strong>Смакуй Волинь</strong><br/>
    📍 м. Ковель, вул. Незалежності, 14<br/>
    📞 +38 (093) 700-68-94
  `)
  .openPopup();