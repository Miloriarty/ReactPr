const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
    console.error('PostgreSQL connection error:', err);
});

async function auth(req, res, next) {
    const userId = Number(req.headers['x-user-id']);
    if (!userId) {
        return res.status(401).json({ error: 'Authorization required' });
    }
    try {
        const user = await findUser(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = { id: user.user_id, role: user.role };
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access only' });
    }
    next();
}

async function findUser(userId) {
    const result = await pool.query(`
        SELECT u.user_id, u.email, r.name AS role,
               c.name AS coupon_name, COALESCE(c.discount_percent, 0) AS coupon_percent
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN coupons c ON c.coupon_id = u.coupon_id
        WHERE u.user_id = $1
    `, [userId]);
    return result.rows[0];
}

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date() });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ message: 'Database connection is working!', current_time: result.rows[0].current_time });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Enter email and password' });
    }
    try {
        const result = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND password = $2',
            [email, password]
        );
        if (!result.rows.length) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = await findUser(result.rows[0].user_id);
        res.json(user);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Enter email and password' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    try {
        const existing = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
        if (existing.rows.length) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        const result = await pool.query(`
            INSERT INTO users (email, password, role_id)
            VALUES ($1, $2, (SELECT role_id FROM roles WHERE name = 'user'))
            RETURNING user_id
        `, [email, password]);
        const user = await findUser(result.rows[0].user_id);
        res.status(201).json(user);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await findUser(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', auth, adminOnly, async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    try {
        const existing = await pool.query('SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length) {
            return res.status(409).json({ error: 'Category already exists' });
        }
        const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', auth, adminOnly, async (req, res) => {
    try {
        const used = await pool.query('SELECT 1 FROM services WHERE category_id = $1 LIMIT 1', [req.params.id]);
        if (used.rows.length) {
            return res.status(409).json({ error: 'Category has products and cannot be deleted' });
        }
        const result = await pool.query('DELETE FROM categories WHERE category_id = $1 RETURNING *', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Category has products and cannot be deleted' });
        }
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/services', async (req, res) => {
    try {
        const ids = (req.query.categories || '')
            .split(',')
            .map(Number)
            .filter(Number.isInteger)
            .filter(n => n > 0);

        const result = await pool.query(`
            SELECT s.service_id, s.name, s.description, s.duration_minutes,
                   s.price::float AS price, s.discount_percent, s.image_url,
                   s.category_id, c.name AS category_name,
                   ROUND(s.price * (100 - s.discount_percent) / 100, 2)::float AS final_price
            FROM services s
            JOIN categories c ON c.category_id = s.category_id
            WHERE cardinality($1::int[]) = 0 OR s.category_id = ANY($1::int[])
            ORDER BY s.service_id
        `, [ids]);
        res.json(result.rows);
    } catch (error) {
        console.error('Services query error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/services/:id/discount', auth, adminOnly, async (req, res) => {
    const percent = Number(req.body.discount_percent);
    if (!Number.isInteger(percent) || (percent !== 0 && (percent < 10 || percent > 90))) {
        return res.status(400).json({ error: 'Discount must be an integer from 10 to 90 (or 0 to remove it)' });
    }
    try {
        const result = await pool.query(
            'UPDATE services SET discount_percent = $1 WHERE service_id = $2 RETURNING *',
            [percent, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/coupons', auth, adminOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM coupons ORDER BY discount_percent');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', auth, adminOnly, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.email, r.name AS role, u.coupon_id
            FROM users u JOIN roles r ON r.role_id = u.role_id
            ORDER BY u.user_id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id/coupon', auth, adminOnly, async (req, res) => {
    const couponId = req.body.coupon_id ?? null;
    try {
        const result = await pool.query(
            'UPDATE users SET coupon_id = $1 WHERE user_id = $2 RETURNING user_id, coupon_id',
            [couponId, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Coupon not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appointments', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, s.name AS service_name
            FROM appointments a
            JOIN services s ON s.service_id = a.service_id
            WHERE $1 = 'admin' OR a.user_id = $2
            ORDER BY a.created_at DESC
        `, [req.user.role, req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/appointments', auth, async (
    req,
    res
) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ error: 'Admins cannot place orders' });
    }
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const user = await findUser(req.user.id);
        const created = [];

        for (const item of items) {
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity < 1) {
                throw Object.assign(new Error('Invalid quantity'), { status: 400 });
            }
            const service = await client.query(
                'SELECT price, discount_percent FROM services WHERE service_id = $1',
                [item.service_id]
            );
            if (!service.rows.length) {
                throw Object.assign(new Error(`Product ${item.service_id} not found`), { status: 400 });
            }
            const { price, discount_percent } = service.rows[0];
            const unit = price * (100 - discount_percent) / 100 * (100 - user.coupon_percent) / 100;
            const amount = Math.round(unit * quantity * 100) / 100;

            const appointment = await client.query(`
                INSERT INTO appointments (user_id, service_id, quantity, price)
                VALUES ($1, $2, $3, $4) RETURNING *
            `, [req.user.id, item.service_id, quantity, amount]);

            await client.query(
                'INSERT INTO payments (appointment_id, amount) VALUES ($1, $2)',
                [appointment.rows[0].appointment_id, amount]
            );
            created.push(appointment.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json(created);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Checkout error:', error);
        res.status(error.status || 500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
