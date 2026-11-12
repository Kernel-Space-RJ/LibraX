const path = require('path'), dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });   // project root
dotenv.config({ path: path.join(__dirname, '.env') });          // or backend/.env
for (const k of ['DB_PASSWORD', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing ${k}: copy .env.example to .env and fill it in`); process.exit(1); }
const { Pool } = require('pg');
module.exports = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: String(process.env.DB_PASSWORD) });
