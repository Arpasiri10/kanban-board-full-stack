import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userExists.rows.length) return res.status(409).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, hash]);
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.log('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!user.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.log('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware: verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    console.log('Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;