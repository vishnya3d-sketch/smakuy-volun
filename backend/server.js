require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// ШЛЯХИ ДО ПАПОК
// =====================


const publicDir = path.join(__dirname, 'public');

const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');
const imgDir = path.join(publicDir, 'img');
const pagesDir = path.join(publicDir, 'pages');

// =====================
// СТАТИКА
// =====================

app.use('/css', express.static(cssDir));
app.use('/js', express.static(jsDir));
app.use('/img', express.static(imgDir));
app.use(express.static(pagesDir));

// =====================
// ПІДКЛЮЧЕННЯ ДО MYSQL
// =====================

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.error('Помилка підключення до БД:', err.message);
    return;
  }
  console.log('Підключено до MySQL');
});

// =====================
// ГОЛОВНА СТОРІНКА
// =====================

app.get('/', (req, res) => {
  res.sendFile(path.join(pagesDir, 'index.html'));
});

// =====================
// ФОРМА КОНТАКТІВ
// =====================

app.post('/api/contact', (req, res) => {
  const { name, phone, email, topic, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Заповніть обов’язкові поля'
    });
  }

  const sql = `
    INSERT INTO messages (name, phone, email, topic, message)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, phone, email, topic, message], (err) => {
    if (err) {
      console.error('Помилка запису в БД:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    res.json({
      success: true,
      message: 'Повідомлення успішно надіслано'
    });
  });
});

// =====================
// ТУРИ
// =====================

app.get('/api/tours', (req, res) => {
  db.query('SELECT * FROM tours ORDER BY id ASC', (err, results) => {
    if (err) {
      console.error('Помилка отримання турів:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    res.json(results);
  });
});

// =====================
// ЗАКЛАДИ
// =====================

app.get('/api/places', (req, res) => {
  db.query('SELECT * FROM places ORDER BY id ASC', (err, results) => {
    if (err) {
      console.error('Помилка отримання закладів:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    res.json(results);
  });
});

// =====================
// МАРШРУТИ
// =====================

app.get('/api/routes', (req, res) => {
  const sql = `
    SELECT 
      r.id,
      r.title,
      r.description,
      r.image,
      r.category,
      r.duration,
      r.distance,
      r.color,
      rp.point_order,
      rp.name AS point_name,
      rp.lat,
      rp.lng
    FROM routes r
    LEFT JOIN route_points rp ON r.id = rp.route_id
    ORDER BY r.id ASC, rp.point_order ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Помилка отримання маршрутів:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    const groupedRoutes = [];

    results.forEach((row) => {
      let route = groupedRoutes.find((r) => r.id === row.id);

      if (!route) {
        route = {
          id: row.id,
          title: row.title,
          description: row.description,
          image: row.image,
          category: row.category,
          duration: row.duration,
          distance: row.distance,
          color: row.color,
          points: []
        };
        groupedRoutes.push(route);
      }

      if (row.point_name && row.lat !== null && row.lng !== null) {
        route.points.push({
          name: row.point_name,
          lat: Number(row.lat),
          lng: Number(row.lng)
        });
      }
    });

    res.json(groupedRoutes);
  });
});

// =====================
// РЕЄСТРАЦІЯ
// =====================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: 'Заповни всі поля'
    });
  }

  const checkSql = `SELECT * FROM users WHERE email = ?`;

  db.query(checkSql, [email], async (err, results) => {
    if (err) {
      console.error('Помилка перевірки email:', err.message);
      return res.json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    if (results.length > 0) {
      return res.json({
        success: false,
        message: 'Email вже існує'
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `;

      db.query(sql, [name, email, hashedPassword, role || 'user'], (insertErr) => {
        if (insertErr) {
          console.error('Помилка реєстрації:', insertErr.message);
          return res.json({
            success: false,
            message: 'Помилка реєстрації'
          });
        }

        res.json({
          success: true,
          message: 'Користувача створено'
        });
      });
    } catch (hashErr) {
      console.error('Помилка хешування пароля:', hashErr.message);
      res.json({
        success: false,
        message: 'Помилка сервера'
      });
    }
  });
});

// =====================
// ЛОГІН
// =====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Помилка входу:', err.message);
      return res.json({
        success: false,
        message: 'Помилка сервера'
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: 'Невірний email'
      });
    }

    try {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({
          success: false,
          message: 'Невірний пароль'
        });
      }

      res.json({
        success: true,
        message: 'Успішний вхід',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (compareErr) {
      console.error('Помилка перевірки пароля:', compareErr.message);
      res.json({
        success: false,
        message: 'Помилка сервера'
      });
    }
  });
});

// =====================
// АДМІНКА: ТУРИ
// =====================

app.post('/api/admin/tours', (req, res) => {
  const { title, description, price, image, link } = req.body;

  const sql = `
    INSERT INTO tours (title, description, price, image, link)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, description, price, image, link], (err) => {
    if (err) {
      console.error('Помилка додавання туру:', err.message);
      return res.json({
        success: false,
        message: 'Помилка додавання туру'
      });
    }

    res.json({
      success: true,
      message: 'Тур додано'
    });
  });
});

// =====================
// АДМІНКА: ЗАКЛАДИ
// =====================

app.post('/api/admin/places', (req, res) => {
  const { title, description, image, category, address, hours, lat, lng } = req.body;

  const sql = `
    INSERT INTO places (title, description, image, category, address, hours, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, description, image, category, address, hours, lat, lng],
    (err) => {
      if (err) {
        console.error('Помилка додавання закладу:', err.message);
        return res.json({
          success: false,
          message: 'Помилка додавання закладу'
        });
      }

      res.json({
        success: true,
        message: 'Заклад додано'
      });
    }
  );
});

app.get('/api/admin/places', (req, res) => {
  db.query('SELECT * FROM places ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Помилка отримання списку закладів:', err.message);
      return res.json([]);
    }

    res.json(results);
  });
});

app.delete('/api/admin/places/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM places WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Помилка видалення закладу:', err.message);
      return res.json({
        success: false,
        message: 'Помилка видалення'
      });
    }

    res.json({
      success: true,
      message: 'Заклад видалено'
    });
  });
});

// =====================
// АДМІНКА: МАРШРУТИ
// =====================

app.post('/api/admin/routes', (req, res) => {
  const { title, description, image, category, duration, distance, color, points } = req.body;

  const routeSql = `
    INSERT INTO routes (title, description, image, category, duration, distance, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    routeSql,
    [title, description, image, category, duration, distance, color],
    (err, result) => {
      if (err) {
        console.error('Помилка додавання маршруту:', err.message);
        return res.json({
          success: false,
          message: 'Помилка додавання маршруту'
        });
      }

      const routeId = result.insertId;

      if (!points || points.length === 0) {
        return res.json({
          success: true,
          message: 'Маршрут додано без точок'
        });
      }

      const values = points.map((point, index) => [
        routeId,
        index + 1,
        point.name,
        point.lat,
        point.lng
      ]);

      const pointsSql = `
        INSERT INTO route_points (route_id, point_order, name, lat, lng)
        VALUES ?
      `;

      db.query(pointsSql, [values], (pointsErr) => {
        if (pointsErr) {
          console.error('Помилка збереження точок маршруту:', pointsErr.message);
          return res.json({
            success: false,
            message: 'Маршрут додано, але точки не збереглись'
          });
        }

        res.json({
          success: true,
          message: 'Маршрут додано'
        });
      });
    }
  );
});

// =====================
// БРОНЮВАННЯ
// =====================

app.post('/api/bookings', (req, res) => {
  const {
    tour_slug,
    tour_title,
    name,
    phone,
    email,
    booking_date,
    people_count,
    comment
  } = req.body;

  if (!name || !email || !booking_date) {
    return res.status(400).json({
      success: false,
      message: 'Заповніть обов’язкові поля'
    });
  }

  const sql = `
    INSERT INTO bookings (
      tour_slug,
      tour_title,
      name,
      phone,
      email,
      booking_date,
      people_count,
      comment
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [tour_slug, tour_title, name, phone, email, booking_date, people_count, comment],
    (err) => {
      if (err) {
        console.error('Помилка бронювання:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Помилка сервера'
        });
      }

      res.json({
        success: true,
        message: 'Бронювання успішно надіслано'
      });
    }
  );
});

// =====================
// АДМІНКА: БРОНЮВАННЯ
// =====================

app.get('/api/admin/bookings', (req, res) => {
  db.query('SELECT * FROM bookings ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Помилка отримання бронювань:', err.message);
      return res.json([]);
    }

    res.json(results);
  });
});

app.delete('/api/admin/bookings/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM bookings WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Помилка видалення бронювання:', err.message);
      return res.json({
        success: false,
        message: 'Не вдалося видалити бронювання'
      });
    }

    res.json({
      success: true,
      message: 'Бронювання видалено'
    });
  });
});

app.patch('/api/admin/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.json({
      success: false,
      message: 'Статус не передано'
    });
  }

  db.query(
    'UPDATE bookings SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        console.error('Помилка оновлення статусу бронювання:', err.message);
        return res.json({
          success: false,
          message: 'Не вдалося оновити статус'
        });
      }

      res.json({
        success: true,
        message: 'Статус оновлено'
      });
    }
  );
});

// =====================
// КАБІНЕТ: МОЇ БРОНЮВАННЯ
// =====================

app.get('/api/my-bookings', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email не передано'
    });
  }

  db.query(
    'SELECT * FROM bookings WHERE email = ? ORDER BY id DESC',
    [email],
    (err, results) => {
      if (err) {
        console.error('Помилка отримання бронювань користувача:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Помилка сервера'
        });
      }

      res.json({
        success: true,
        bookings: results
      });
    }
  );
});

// =====================
// СТАРТ СЕРВЕРА
// =====================

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});