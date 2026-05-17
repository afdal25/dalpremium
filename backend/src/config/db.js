const mysql = require('mysql2/promise');
require('dotenv').config();

// Membuat pool koneksi ke MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tes koneksi
pool.getConnection()
    .then(connection => {
        console.log('✅ Berhasil terhubung ke database dashboard_operasional!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Gagal terhubung ke database:', err.message);
    });

module.exports = pool;