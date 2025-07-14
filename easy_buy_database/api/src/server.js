require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { initDb } = require('./utils/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');

// Ensure upload directory exists
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// CORS (restrict in production!)
// Allow frontend dev server and static file access
app.use(cors({
    origin: process.env.FRONTEND_DEV_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', uploadsDir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 4000;

// Initialize DB and start server
initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize DB:', err);
        process.exit(1);
    });
