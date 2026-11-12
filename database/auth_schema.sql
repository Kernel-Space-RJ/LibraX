CREATE TABLE IF NOT EXISTS AUTH_USERS (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('admin','staff','member')),
  staff_id INT UNIQUE REFERENCES STAFF(staff_id) ON DELETE CASCADE,
  member_id INT UNIQUE REFERENCES MEMBERS(member_id) ON DELETE CASCADE,
  CHECK ((role='admin' AND staff_id IS NULL AND member_id IS NULL)
      OR (role='staff' AND staff_id IS NOT NULL AND member_id IS NULL)
      OR (role='member' AND member_id IS NOT NULL AND staff_id IS NULL))
);
