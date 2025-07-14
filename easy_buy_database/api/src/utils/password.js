const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// PUBLIC_INTERFACE
async function hashPassword(plainText) {
    /**
     * Hashes a password with bcrypt.
     * @param {string} plainText - Unhashed password
     * @returns {string} bcrypt hash
     */
    return bcrypt.hash(plainText, SALT_ROUNDS);
}

// PUBLIC_INTERFACE
async function comparePassword(plainText, hash) {
    /**
     * Compares a plaintext password with a hash.
     * @param {string} plainText - User supplied password
     * @param {string} hash - Hashed password from DB
     * @returns {boolean}
     */
    return bcrypt.compare(plainText, hash);
}

module.exports = { hashPassword, comparePassword };
