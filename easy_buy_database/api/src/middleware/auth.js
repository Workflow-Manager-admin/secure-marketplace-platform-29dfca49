const { verifyJwt } = require('../utils/jwt');

// PUBLIC_INTERFACE
function requireAuth(req, res, next) {
    /**
     * Express middleware to enforce JWT authentication.
     * Looks for "Authorization: Bearer <token>".
     * On success, sets req.user to decoded payload.
     * On failure, returns 401.
     */
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);

    if (!match) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    try {
        const decoded = verifyJwt(match[1]);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };
