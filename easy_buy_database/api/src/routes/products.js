const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../utils/db');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all active products (optionally filtered)
 */
router.get('/', async (req, res) => {
    try {
        const pool = getPool();
        const [products] = await pool.query(
            "SELECT p.*, u.username as seller_username, u.display_name as seller_display_name \
            FROM products p \
            JOIN users u ON u.id = p.seller_id \
            WHERE p.is_active = 1 \
            ORDER BY p.created_at DESC"
        );
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product detail (with images)
 */
router.get('/:id', async (req, res) => {
    try {
        const pool = getPool();
        const [products] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [req.params.id]
        );
        if (!products.length) return res.status(404).json({ error: 'Product not found' });

        const [images] = await pool.query(
            "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
            [req.params.id]
        );
        let product = products[0];
        product.images = images;
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product (requires auth)
 */
router.post('/', requireAuth, [
    body('name').isLength({ min: 2 }),
    body('price').isFloat({ min: 0.01 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, description, price } = req.body;

    try {
        const pool = getPool();
        const [result] = await pool.query(
            "INSERT INTO products (seller_id, name, description, price) VALUES (?, ?, ?, ?)",
            [req.user.id, name, description, price]
        );
        res.status(201).json({ id: result.insertId, message: 'Product created' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product (seller only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, is_active } = req.body;
    try {
        const pool = getPool();
        // Only seller can update their product
        const [products] = await pool.query(
            "SELECT seller_id FROM products WHERE id = ?",
            [productId]
        );
        if (!products.length) return res.status(404).json({ error: 'Product not found' });
        if (products[0].seller_id !== req.user.id)
            return res.status(403).json({ error: 'Not allowed' });

        await pool.query(
            "UPDATE products SET name=?, description=?, price=?, is_active=? WHERE id=?",
            [name, description, price, is_active, productId]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (seller only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
    const productId = req.params.id;
    try {
        const pool = getPool();
        // Only seller can delete product
        const [products] = await pool.query(
            "SELECT seller_id FROM products WHERE id = ?",
            [productId]
        );
        if (!products.length) return res.status(404).json({ error: 'Product not found' });
        if (products[0].seller_id !== req.user.id)
            return res.status(403).json({ error: 'Not allowed' });

        await pool.query(
            "DELETE FROM products WHERE id = ?",
            [productId]
        );
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload product images (requires auth, seller)
 * @access  Private (JWT)
 */
const allowedTypes = ['image/jpeg', 'image/png'];
const MAX_FILES = 5;
const MAX_SIZE = 2 * 1024 * 1024;
// Use imageUpload from upload module (compatible export)
const imageUpload = upload.imageUpload;

router.post('/:id/images', requireAuth, imageUpload.array('images', MAX_FILES), async (req, res) => {
    const productId = req.params.id;
    try {
        const pool = getPool();
        // Only seller can upload images to own product
        const [products] = await pool.query(
            "SELECT seller_id FROM products WHERE id = ?",
            [productId]
        );
        if (!products.length) return res.status(404).json({ error: 'Product not found' });
        if (products[0].seller_id !== req.user.id)
            return res.status(403).json({ error: 'Not allowed' });

        if (!req.files || !req.files.length)
            return res.status(400).json({ error: 'No files uploaded' });

        // Security check each file after multer handling (should be redundant, double check)
        const savedFiles = [];
        for (const file of req.files) {
            if (!allowedTypes.includes(file.mimetype)) {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                continue;
            }
            if (file.size > MAX_SIZE) {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                continue;
            }
            // Success path: add to DB
            await pool.query(
                "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
                [productId, `/uploads/${file.filename}`]
            );
            savedFiles.push(`/uploads/${file.filename}`);
        }
        if (!savedFiles.length) {
            return res.status(400).json({ error: 'No valid images uploaded' });
        }

        res.status(201).json({ message: 'Images uploaded', files: savedFiles });
    } catch (err) {
        if (req.files) {
            req.files.forEach((file) => {
                if (file && file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

/**
 * @route   GET /api/products/:productId/images/:imageId
 * @desc    Serve a product image by imageId
 * @access  Public (for product display)
 */
router.get('/:productId/images/:imageId', async (req, res) => {
    const { productId, imageId } = req.params;
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT image_url FROM product_images WHERE id=? AND product_id=?",
            [imageId, productId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Image not found' });
        const relPath = rows[0].image_url.startsWith('/uploads/')
            ? rows[0].image_url.replace(/^\\/uploads\\//, '')
            : null;
        if (!relPath) return res.status(404).json({ error: 'Image not found' });

        // Only allow jpeg/png
        const ext = relPath.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png'].includes(ext)) {
            return res.status(403).json({ error: 'Unsupported image type.' });
        }
        const absPath = path.join(__dirname, '..', '..', 'uploads', relPath);
        if (!fs.existsSync(absPath)) {
            return res.status(404).json({ error: 'File missing from server.' });
        }
        res.sendFile(absPath, {
            headers: {
                'Content-Type': ext === 'png' ? 'image/png' : 'image/jpeg',
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

module.exports = router;
