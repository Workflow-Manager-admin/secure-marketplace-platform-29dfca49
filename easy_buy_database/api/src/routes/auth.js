const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../utils/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post('/register', [
    body('username').isLength({ min: 3, max: 40 }).trim(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;

    try {
        const pool = getPool();

        // Check unique username/email
        const [[{ countUsername }]] = await pool.query(
            "SELECT COUNT(*) as countUsername FROM users WHERE username = ?",
            [username]
        );
        const [[{ countEmail }]] = await pool.query(
            "SELECT COUNT(*) as countEmail FROM users WHERE email = ?",
            [email]
        );
        if (countUsername > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }
        if (countEmail > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const pwHash = await hashPassword(password);

        // Insert
        await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, pwHash]
        );

        return res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT
 */
router.post('/login', [
    body('email').isEmail(),
    body('password').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
        const pool = getPool();
        const [users] = await pool.query(
            "SELECT id, username, email, password_hash FROM users WHERE email = ?",
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = users[0];
        const match = await comparePassword(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Create token, exclude password_hash
        const token = signJwt({
            id: user.id,
            username: user.username,
            email: user.email
        });
        return res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
