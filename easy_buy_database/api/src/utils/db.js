const mysql = require('mysql2/promise');

// Singleton for connection pool
let pool = null;

// PUBLIC_INTERFACE
async function initDb() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            timezone: 'Z' // always store/query in UTC
        });
    }
    // Test connection
    await pool.getConnection().then(conn => conn.release());
    console.log('Successfully connected to MySQL');
}

function getPool() {
    if (!pool) throw new Error('Database not initialized, call initDb first!');
    return pool;
}

module.exports = { initDb, getPool };
