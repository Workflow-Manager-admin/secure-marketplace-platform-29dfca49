const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../utils/db');

const router = express.Router();

/**
 * @route   GET /api/chat/:userId
 * @desc    Fetch chat messages with another user (requires auth)
 */
router.get('/:userId', requireAuth, async (req, res) => {
    const myId = req.user.id;
    const otherId = req.params.userId;
    try {
        const pool = getPool();
        const [messages] = await pool.query(
            "SELECT * FROM chat_messages \
             WHERE (sender_id = ? AND receiver_id = ?) \
                OR (sender_id = ? AND receiver_id = ?) \
             ORDER BY sent_at ASC",
            [myId, otherId, otherId, myId]
        );
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
});

/**
 * @route   POST /api/chat/:userId
 * @desc    Send a message to another user (requires auth)
 */
router.post('/:userId', requireAuth, async (req, res) => {
    const myId = req.user.id;
    const otherId = req.params.userId;
    const { product_id, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    try {
        const pool = getPool();
        await pool.query(
            "INSERT INTO chat_messages (sender_id, receiver_id, product_id, message) VALUES (?, ?, ?, ?)",
            [myId, otherId, product_id || null, message]
        );
        res.status(201).json({ message: 'Sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
