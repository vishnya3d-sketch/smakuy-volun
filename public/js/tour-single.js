// =====================
// ГАЛЕРЕЯ — перемикання фото
// =====================

const mainImg = document.querySelector('.gallery-main');
const thumbs = document.querySelectorAll('.gallery-thumbs img');

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    mainImg.src = thumb.src;
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  });
});

if (thumbs.length > 0) {
  thumbs[0].classList.add('active');
}

// =====================
// ФОРМА БРОНЮВАННЯ
// =====================

async function submitBooking() {
  const name = document.getElementById('booking-name').value.trim();
  const phone = document.getElementById('booking-phone').value.trim();
  const email = document.getElementById('booking-email').value.trim();
  const bookingDate = document.getElementById('booking-date').value;
  const peopleCount = document.getElementById('booking-people').value;
  const comment = document.getElementById('booking-comment').value.trim();
  const note = document.getElementById('booking-note');
  const btn = document.querySelector('.btn-submit');

  const tourTitle = document.querySelector('h1').textContent.trim();
  const tourSlug = window.location.pathname.split('/').pop().replace('.html', '');

  if (!name) {
    note.textContent = "Будь ласка, введіть ваше ім'я";
    note.className = 'form-note error';
    return;
  }

  if (!phone) {
    note.textContent = "Будь ласка, введіть номер телефону";
    note.className = 'form-note error';
    return;
  }

  if (!email || !email.includes('@')) {
    note.textContent = "Будь ласка, введіть коректний email";
    note.className = 'form-note error';
    return;
  }

  if (!bookingDate) {
    note.textContent = "Будь ласка, оберіть бажану дату";
    note.className = 'form-note error';
    return;
  }

  try {
    btn.textContent = "Надсилання...";
    btn.disabled = true;

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tour_slug: tourSlug,
        tour_title: tourTitle,
        name,
        phone,
        email,
        booking_date: bookingDate,
        people_count: peopleCount,
        comment
      })
    });

    const data = await response.json();

    if (data.success) {
      btn.textContent = "✓ Заявку надіслано!";
      btn.style.background = "#388e3c";

      note.textContent = "Дякуємо! Ми зв'яжемося з вами найближчим часом.";
      note.className = 'form-note success';

      document.getElementById('booking-name').value = '';
      document.getElementById('booking-phone').value = '';
      document.getElementById('booking-email').value = '';
      document.getElementById('booking-date').value = '';
      document.getElementById('booking-people').selectedIndex = 0;
      document.getElementById('booking-comment').value = '';
    } else {
      note.textContent = data.message || "Помилка відправлення";
      note.className = 'form-note error';
      btn.textContent = "Надіслати заявку";
      btn.disabled = false;
    }
  } catch (error) {
    note.textContent = "Помилка з'єднання";
    note.className = 'form-note error';
    btn.textContent = "Надіслати заявку";
    btn.disabled = false;
  }
}

// =====================
// ПЛАВНИЙ СКРОЛ ДО ФОРМИ
// =====================

document.querySelector('.btn-book').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
});