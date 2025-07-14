const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../utils/db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @route   GET /api/settings/me
 * @desc    Fetch current user's settings
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT * FROM user_settings WHERE user_id = ?",
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Settings not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * @route   PUT /api/settings/me
 * @desc    Update settings for current user
 */
router.put('/me', requireAuth, [
    body('email_notifications').optional().isBoolean(),
    body('push_notifications').optional().isBoolean(),
    body('dark_mode').optional().isBoolean(),
    body('language').optional().isString().isLength({ max: 16 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email_notifications, push_notifications, dark_mode, language } = req.body;
    try {
        const pool = getPool();
        // Ensure row exists
        await pool.query(
            `INSERT IGNORE INTO user_settings (user_id) VALUES (?)`,
            [req.user.id]
        );
        // Update the record
        await pool.query(
            `UPDATE user_settings SET 
                email_notifications = COALESCE(?, email_notifications),
                push_notifications = COALESCE(?, push_notifications),
                dark_mode = COALESCE(?, dark_mode),
                language = COALESCE(?, language)
             WHERE user_id = ?`,
            [email_notifications, push_notifications, dark_mode, language, req.user.id]
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
