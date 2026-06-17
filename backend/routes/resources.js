const express      = require('express');
const pool         = require('../db');
const auth         = require('../middleware/auth');
const { findMatches } = require('../matcher');
const router       = express.Router();

router.post('/', auth, async (req, res) => {
  const { title, description, category, type, latitude, longitude, expiry_at } = req.body;
  if (!title || !category || !type || !latitude || !longitude || !expiry_at)
    return res.status(400).json({ error: 'Missing required fields' });
  if (!['food', 'skill', 'item'].includes(category))
    return res.status(400).json({ error: 'Category must be food, skill, or item' });
  if (!['have', 'need'].includes(type))
    return res.status(400).json({ error: 'Type must be have or need' });
  try {
    const result = await pool.query(
      `INSERT INTO resources (user_id, title, description, category, type, latitude, longitude, expiry_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, description, category, type, latitude, longitude, expiry_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  const { category, type } = req.query;
  let query = `SELECT r.*, u.name as user_name FROM resources r
               JOIN users u ON r.user_id = u.id
               WHERE r.expiry_at > NOW() AND r.is_matched = FALSE`;
  const params = [];
  if (category) { params.push(category); query += ` AND r.category = $${params.length}`; }
  if (type)     { params.push(type);     query += ` AND r.type = $${params.length}`; }
  query += ' ORDER BY r.created_at DESC';
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/matches', auth, async (req, res) => {
  try {
    const resourceResult = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    const resource = resourceResult.rows[0];
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    const oppositeType = resource.type === 'need' ? 'have' : 'need';
    const offersResult = await pool.query(
      `SELECT * FROM resources WHERE type = $1 AND category = $2
       AND is_matched = FALSE AND expiry_at > NOW() AND id != $3`,
      [oppositeType, resource.category, resource.id]
    );
    const matches = findMatches(resource, offersResult.rows);
    res.json({ resource, matches, totalFound: matches.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/confirm-match', auth, async (req, res) => {
  const { offer_id, request_id, score } = req.body;
  try {
    await pool.query('INSERT INTO matches (offer_id, request_id, score) VALUES ($1, $2, $3)', [offer_id, request_id, score]);
    await pool.query('UPDATE resources SET is_matched = TRUE WHERE id = ANY($1)', [[offer_id, request_id]]);
    res.json({ message: 'Match confirmed!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;