const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../utils/db');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

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
 * @route   POST /api/users/me/image
 * @desc    Upload user profile image (protected)
 * @access  Private (JWT)
 */
router.post('/me/image', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No image uploaded' });
    const file = req.file;
    // Accept only image mime and <2MB (handled both here and by upload.js imageUpload if swapped)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        // Delete file
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid file type. Only JPG/PNG/GIF/WEBP allowed.' });
    }
    if (file.size > 2 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'File size exceeds 2MB.' });
    }
    // Sanitize file name and build relative URL
    const relUrl = `/uploads/${file.filename}`;
    try {
        const pool = getPool();
        // Remove previous image if not default and not http(s)
        const [users] = await pool.query(
            "SELECT profile_image_url FROM users WHERE id = ?", [req.user.id]
        );
        if (users[0] && users[0].profile_image_url &&
            users[0].profile_image_url.startsWith('/uploads/') &&
            users[0].profile_image_url !== relUrl) {
            // Only delete previous if local (ignore legacy external)
            const prevPath = path.join(__dirname, '..', '..', users[0].profile_image_url);
            if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
        }
        // Update user profile_image_url in DB
        await pool.query(
            "UPDATE users SET profile_image_url = ? WHERE id = ?",
            [relUrl, req.user.id]
        );
        res.status(201).json({ message: "Profile image uploaded", profile_image_url: relUrl });
    } catch (err) {
        // Rollback file
        fs.unlinkSync(file.path);
        res.status(500).json({ error: 'Failed to save profile image' });
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
