const { Pool } = require("pg");
require("dotenv").config();
const isProduction = process.env.NODE_ENV === "production";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
 ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL connected");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection error:", err);
  });

module.exports = pool;