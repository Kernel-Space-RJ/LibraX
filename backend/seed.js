// Creates bcrypt-hashed AUTH_USERS rows for admin + every STAFF and MEMBERS row.
const pool = require('./db'), bcrypt = require('bcrypt');
(async () => {
  await pool.query(`INSERT INTO AUTH_USERS(email,password_hash,role) VALUES('admin@librax.com',$1,'admin') ON CONFLICT DO NOTHING`, [await bcrypt.hash('Admin@123', 10)]);
  const pw = await bcrypt.hash('Password@123', 10);
  await pool.query(`INSERT INTO AUTH_USERS(email,password_hash,role,staff_id) SELECT email,$1,'staff',staff_id FROM STAFF ON CONFLICT DO NOTHING`, [pw]);
  await pool.query(`INSERT INTO AUTH_USERS(email,password_hash,role,member_id) SELECT email,$1,'member',member_id FROM MEMBERS ON CONFLICT DO NOTHING`, [pw]);
  console.log('Seeded. admin@librax.com / Admin@123 ; staff & members: <their email> / Password@123');
  process.exit();
})();
