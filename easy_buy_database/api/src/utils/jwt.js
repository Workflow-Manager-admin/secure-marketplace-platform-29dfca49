const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'unsafe_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// PUBLIC_INTERFACE
function signJwt(payload) {
    /**
     * Signs a JWT token using configured secret.
     * @param {object} payload - Content to sign (typically user info)
     * @returns {string} the JWT token
     */
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// PUBLIC_INTERFACE
function verifyJwt(token) {
    /**
     * Verifies a JWT token and returns decoded payload or throws on error.
     * @param {string} token - JWT
     * @returns {object} decoded payload
     */
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { signJwt, verifyJwt };
