const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../utils/db');

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile (protected)
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [users] = await pool.query(
            "SELECT id, username, email, display_name, profile_image_url, created_at FROM users WHERE id = ?",
            [req.user.id]
        );
        if (!users.length) return res.status(404).json({ error: 'User not found' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile (protected)
 */
router.put('/me', requireAuth, [
    body('display_name').optional().isString(),
    body('profile_image_url').optional().isString()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { display_name, profile_image_url } = req.body;
    try {
        const pool = getPool();
        await pool.query(
            "UPDATE users SET display_name=?, profile_image_url=? WHERE id=?",
            [display_name, profile_image_url, req.user.id]
        );
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get public user profile by id (no secret fields)
 */
router.get('/:id', async (req, res) => {
    try {
        const pool = getPool();
        const [users] = await pool.query(
            "SELECT id, username, display_name, profile_image_url FROM users WHERE id = ?",
            [req.params.id]
        );
        if (!users.length) return res.status(404).json({ error: 'User not found' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
