const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Chose env (default "uploads")
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // e.g., product-12345-20231010T1530.jpg
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e5);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + unique + ext);
    }
});

const upload = multer({ storage });

module.exports = upload;
