const { Pool } = require('pg');

// Tao ket noi PostgreSQL tu bien moi truong; khong ghi mat khau vao ma nguon.
function taoKetNoiPostgreSQL() {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'mekong_mobile',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX || 10),
  });
}

module.exports = { taoKetNoiPostgreSQL };
