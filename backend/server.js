const pool = require('./db'), express = require('express'), cors = require('cors'), bcrypt = require('bcrypt'), jwt = require('jsonwebtoken');
const app = express(); app.use(cors(), express.json());
const q = (s, p) => pool.query(s, p).then(r => r.rows);
const FINE = Number(process.env.FINE_PER_DAY || 5);
const err = (status, message) => Object.assign(new Error(message), { status });
const H = f => (req, res) => f(req, res).catch(e => {
  const m = { 23505: [409, 'Duplicate value (e.g. ISBN already exists)'], 23503: [409, 'Record is referenced by other data'], 23514: [400, 'Invalid value'] }[e.code];
  res.status(e.status || (m && m[0]) || 500).json({ error: e.status ? e.message : (m && m[1]) || e.message });
});
const auth = (...roles) => (req, res, next) => {
  try { const u = jwt.verify((req.headers.authorization || '').slice(7), process.env.JWT_SECRET);
    if (roles.length && !roles.includes(u.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = u; next(); } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
const tx = async fn => { const c = await pool.connect(); try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r; } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); } };
const ST = ['admin', 'staff'];

app.get('/api/health', H(async (_, res) => res.json({ db: (await q('SELECT now()'))[0].now })));
app.post('/api/auth/login', H(async (req, res) => {
  const { email, password, role } = req.body;
  const [u] = await q(`SELECT a.*, COALESCE(s.staff_name,m.full_name,'Administrator') name FROM AUTH_USERS a LEFT JOIN STAFF s USING(staff_id) LEFT JOIN MEMBERS m USING(member_id) WHERE a.email=$1 AND a.role=$2`, [email, role]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) throw err(401, 'Incorrect email or password');
  const user = { id: u.user_id, role: u.role, staff_id: u.staff_id, member_id: u.member_id, name: u.name };
  res.json({ token: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' }), user });
}));
app.get('/api/lookups', auth(), H(async (_, res) => res.json({
  publishers: await q('SELECT * FROM PUBLISHER ORDER BY publisher_name'),
  categories: await q('SELECT * FROM CATEGORY ORDER BY category_name'),
  authors: await q('SELECT author_id, author_name FROM AUTHORS ORDER BY author_name') })));

app.get('/api/books', auth(), H(async (req, res) => {
  const { search = '', category = null, publisher = null } = req.query;
  res.json(await q(`SELECT b.*, p.publisher_name, c.category_name,
    (SELECT string_agg(a.author_name, ', ') FROM BOOK_AUTHORS ba JOIN AUTHORS a USING(author_id) WHERE ba.book_id=b.book_id) authors,
    (SELECT COALESCE(array_agg(author_id),'{}') FROM BOOK_AUTHORS WHERE book_id=b.book_id) author_ids,
    (SELECT count(*) FROM BOOK_COPIES WHERE book_id=b.book_id)::int copies,
    (SELECT count(*) FROM BOOK_COPIES WHERE book_id=b.book_id AND status='Available')::int available
    FROM BOOKS b LEFT JOIN PUBLISHER p USING(publisher_id) LEFT JOIN CATEGORY c USING(category_id)
    WHERE (b.title ILIKE $1 OR b.isbn ILIKE $1 OR EXISTS (SELECT 1 FROM BOOK_AUTHORS ba JOIN AUTHORS a USING(author_id) WHERE ba.book_id=b.book_id AND a.author_name ILIKE $1))
    AND ($2::int IS NULL OR b.category_id=$2) AND ($3::int IS NULL OR b.publisher_id=$3) ORDER BY b.book_id DESC`,
    ['%' + search + '%', category || null, publisher || null]));
}));
const setAuthors = async (c, id, names) => { // names: comma-separated text; creates missing authors in AUTHORS
  if (names === undefined) return;
  await c.query('DELETE FROM BOOK_AUTHORS WHERE book_id=$1', [id]);
  for (const n of [...new Set(String(names).split(',').map(x => x.trim()).filter(Boolean))]) {
    let { rows: [a] } = await c.query('SELECT author_id FROM AUTHORS WHERE lower(author_name)=lower($1) LIMIT 1', [n]);
    if (!a) ({ rows: [a] } = await c.query('INSERT INTO AUTHORS(author_name) VALUES($1) RETURNING author_id', [n]));
    await c.query('INSERT INTO BOOK_AUTHORS VALUES($1,$2) ON CONFLICT DO NOTHING', [id, a.author_id]);
  } };
app.post('/api/books', auth(...ST), H(async (req, res) => {
  const b = req.body; if (!b.title || !b.isbn) throw err(400, 'Title and ISBN are required');
  res.status(201).json(await tx(async c => {
    const { rows: [r] } = await c.query('INSERT INTO BOOKS(isbn,title,publisher_id,category_id,publication_year) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [b.isbn, b.title, b.publisher_id || null, b.category_id || null, b.publication_year || null]);
    await setAuthors(c, r.book_id, b.author_names);
    for (let i = 0; i < (Number(b.copies) || 0); i++) await c.query('INSERT INTO BOOK_COPIES(book_id) VALUES($1)', [r.book_id]);
    return r; }));
}));
app.put('/api/books/:id', auth(...ST), H(async (req, res) => {
  const b = req.body;
  res.json(await tx(async c => {
    const { rows: [r] } = await c.query('UPDATE BOOKS SET isbn=$1,title=$2,publisher_id=$3,category_id=$4,publication_year=$5 WHERE book_id=$6 RETURNING *',
      [b.isbn, b.title, b.publisher_id || null, b.category_id || null, b.publication_year || null, req.params.id]);
    if (!r) throw err(404, 'Book not found');
    await setAuthors(c, r.book_id, b.author_names);
    for (let i = 0; i < (Number(b.add_copies) || 0); i++) await c.query('INSERT INTO BOOK_COPIES(book_id) VALUES($1)', [r.book_id]);
    return r; }));
}));
app.delete('/api/books/:id', auth('admin'), H(async (req, res) => { await q('DELETE FROM BOOKS WHERE book_id=$1', [req.params.id]); res.json({ ok: true }); }));
app.get('/api/copies', auth(...ST), H(async (req, res) => res.json(await q(
  `SELECT bc.*, b.title FROM BOOK_COPIES bc JOIN BOOKS b USING(book_id) WHERE ($1::text IS NULL OR bc.status=$1) ORDER BY copy_id`, [req.query.status || null]))));
app.patch('/api/copies/:id', auth(...ST), H(async (req, res) => res.json((await q('UPDATE BOOK_COPIES SET status=$1 WHERE copy_id=$2 RETURNING *', [req.body.status, req.params.id]))[0])));

app.get('/api/members', auth(...ST), H(async (_, res) => res.json(await q('SELECT * FROM MEMBERS ORDER BY member_id DESC'))));
app.get('/api/staff', auth('admin'), H(async (_, res) => res.json(await q('SELECT * FROM STAFF ORDER BY staff_id'))));
app.get('/api/me', auth('member'), H(async (req, res) => res.json((await q('SELECT * FROM MEMBERS WHERE member_id=$1', [req.user.member_id]))[0])));

app.get('/api/issues', auth(...ST, 'member'), H(async (req, res) => res.json(await q(
  `SELECT i.*, b.title, m.full_name, (i.return_date IS NULL AND i.due_date<CURRENT_DATE) overdue FROM ISSUE_RECORD i
   JOIN BOOK_COPIES bc USING(copy_id) JOIN BOOKS b USING(book_id) JOIN MEMBERS m USING(member_id)
   WHERE ($1::bool IS NOT TRUE OR i.return_date IS NULL) AND ($2::int IS NULL OR i.member_id=$2) ORDER BY i.issue_id DESC`,
  [req.query.active === '1' || null, req.user.role === 'member' ? req.user.member_id : null]))));
app.post('/api/issue', auth(...ST), H(async (req, res) => {
  const { copy_id, member_id } = req.body;
  res.status(201).json(await tx(async c => {
    const { rows: [cp] } = await c.query('SELECT status FROM BOOK_COPIES WHERE copy_id=$1 FOR UPDATE', [copy_id]);
    if (!cp) throw err(404, 'Copy not found'); if (cp.status !== 'Available') throw err(400, `Copy is ${cp.status}`);
    const { rows: [m] } = await c.query(`SELECT max_issue_limit, (SELECT count(*) FROM ISSUE_RECORD WHERE member_id=$1 AND return_date IS NULL)::int n FROM MEMBERS WHERE member_id=$1`, [member_id]);
    if (!m) throw err(404, 'Member not found'); if (m.n >= m.max_issue_limit) throw err(400, 'Member reached issue limit');
    const { rows: [r] } = await c.query(`INSERT INTO ISSUE_RECORD(copy_id,member_id,staff_id,issue_date,due_date) VALUES($1,$2,$3,CURRENT_DATE,CURRENT_DATE+14) RETURNING *`, [copy_id, member_id, req.user.staff_id]);
    await c.query(`UPDATE BOOK_COPIES SET status='Issued' WHERE copy_id=$1`, [copy_id]);
    await c.query(`UPDATE RESERVATIONS SET status='Fulfilled' WHERE reservation_id=(SELECT reservation_id FROM RESERVATIONS WHERE member_id=$1 AND status='Pending' AND book_id=(SELECT book_id FROM BOOK_COPIES WHERE copy_id=$2) LIMIT 1)`, [member_id, copy_id]);
    return r; }));
}));
app.post('/api/return/:id', auth(...ST), H(async (req, res) => res.json(await tx(async c => {
  const { rows: [r] } = await c.query(`UPDATE ISSUE_RECORD SET return_date=CURRENT_DATE WHERE issue_id=$1 AND return_date IS NULL RETURNING *, GREATEST(CURRENT_DATE-due_date,0) late`, [req.params.id]);
  if (!r) throw err(404, 'Active issue not found');
  await c.query(`UPDATE BOOK_COPIES SET status='Available' WHERE copy_id=$1`, [r.copy_id]);
  const fine = r.late * FINE;
  if (fine > 0) await c.query('INSERT INTO FINES(issue_id,amount) VALUES($1,$2)', [r.issue_id, fine]);
  return { ...r, fine }; }))));

app.get('/api/reservations', auth(), H(async (req, res) => res.json(await q(
  `SELECT r.*, b.title, m.full_name FROM RESERVATIONS r JOIN BOOKS b USING(book_id) JOIN MEMBERS m USING(member_id)
   WHERE ($1::int IS NULL OR r.member_id=$1) ORDER BY reservation_id DESC`, [req.user.role === 'member' ? req.user.member_id : null]))));
app.post('/api/reservations', auth('member'), H(async (req, res) => {
  const dup = await q(`SELECT 1 FROM RESERVATIONS WHERE book_id=$1 AND member_id=$2 AND status='Pending'`, [req.body.book_id, req.user.member_id]);
  if (dup.length) throw err(409, 'You already have a pending reservation for this book');
  res.status(201).json((await q('INSERT INTO RESERVATIONS(book_id,member_id) VALUES($1,$2) RETURNING *', [req.body.book_id, req.user.member_id]))[0]);
}));
app.patch('/api/reservations/:id', auth(), H(async (req, res) => {
  const m = req.user.role === 'member';
  res.json((await q(`UPDATE RESERVATIONS SET status=$1 WHERE reservation_id=$2 AND ($3::int IS NULL OR member_id=$3) RETURNING *`, [m ? 'Cancelled' : req.body.status, req.params.id, m ? req.user.member_id : null]))[0]);
}));

app.get('/api/fines', auth(), H(async (req, res) => res.json(await q(
  `SELECT f.*, m.full_name, b.title FROM FINES f JOIN ISSUE_RECORD i USING(issue_id) JOIN MEMBERS m USING(member_id)
   JOIN BOOK_COPIES bc USING(copy_id) JOIN BOOKS b USING(book_id) WHERE ($1::int IS NULL OR i.member_id=$1) ORDER BY fine_id DESC`, [req.user.role === 'member' ? req.user.member_id : null]))));
app.patch('/api/fines/:id/pay', auth(...ST), H(async (req, res) => res.json((await q(`UPDATE FINES SET payment_status='Paid' WHERE fine_id=$1 RETURNING *`, [req.params.id]))[0])));
app.post('/api/fines/generate', auth(...ST), H(async (_, res) => {
  const r = await q(`INSERT INTO FINES(issue_id,amount) SELECT issue_id,(CURRENT_DATE-due_date)*$1 FROM ISSUE_RECORD i WHERE return_date IS NULL AND due_date<CURRENT_DATE
    AND NOT EXISTS (SELECT 1 FROM FINES f WHERE f.issue_id=i.issue_id) RETURNING fine_id`, [FINE]);
  res.json({ created: r.length }); }));

app.get('/api/dashboard', auth(...ST), H(async (_, res) => {
  const [s] = await q(`SELECT (SELECT count(*) FROM BOOKS)::int books,(SELECT count(*) FROM BOOK_COPIES)::int copies,(SELECT count(*) FROM MEMBERS)::int members,
    (SELECT count(*) FROM STAFF)::int staff,(SELECT count(*) FROM AUTHORS)::int authors,(SELECT count(*) FROM PUBLISHER)::int publishers,
    (SELECT count(*) FROM ISSUE_RECORD WHERE return_date IS NULL)::int issued,(SELECT count(*) FROM BOOK_COPIES WHERE status='Available')::int available,
    (SELECT count(*) FROM RESERVATIONS WHERE status='Pending')::int pending,
    (SELECT COALESCE(sum(amount),0) FROM FINES WHERE payment_status='Unpaid')::float unpaid,(SELECT COALESCE(sum(amount),0) FROM FINES WHERE payment_status='Paid')::float collected`);
  res.json({ stats: s,
    monthly: await q(`SELECT to_char(date_trunc('month',issue_date),'Mon YY') AS month, count(*)::int AS issues FROM ISSUE_RECORD GROUP BY date_trunc('month',issue_date) ORDER BY date_trunc('month',issue_date)`),
    categories: await q(`SELECT c.category_name AS name, count(*)::int AS value FROM ISSUE_RECORD i JOIN BOOK_COPIES bc USING(copy_id) JOIN BOOKS b USING(book_id) JOIN CATEGORY c USING(category_id) GROUP BY 1 ORDER BY 2 DESC LIMIT 6`),
    recentIssues: await q(`SELECT i.issue_id, b.title, m.full_name, i.issue_date FROM ISSUE_RECORD i JOIN BOOK_COPIES bc USING(copy_id) JOIN BOOKS b USING(book_id) JOIN MEMBERS m USING(member_id) ORDER BY issue_id DESC LIMIT 5`),
    recentMembers: await q('SELECT member_id, full_name, member_type, join_date FROM MEMBERS ORDER BY member_id DESC LIMIT 5') });
}));

const ENT = { authors: ['AUTHORS', 'author_id', ['author_name', 'biography', 'email']], publishers: ['PUBLISHER', 'publisher_id', ['publisher_name', 'address', 'phone', 'email']], categories: ['CATEGORY', 'category_id', ['category_name', 'shelf_location']] };
Object.entries(ENT).forEach(([k, [t, id, f]]) => {
  app.get('/api/' + k, auth(...ST), H(async (_, res) => res.json(await q(`SELECT * FROM ${t} ORDER BY ${id} DESC`))));
  app.post('/api/' + k, auth(...ST), H(async (req, res) => { if (!req.body[f[0]]) throw err(400, f[0] + ' is required');
    res.status(201).json((await q(`INSERT INTO ${t}(${f}) VALUES(${f.map((_, i) => '$' + (i + 1))}) RETURNING *`, f.map(x => req.body[x] || null)))[0]); }));
  app.put('/api/' + k + '/:id', auth(...ST), H(async (req, res) => { if (!req.body[f[0]]) throw err(400, f[0] + ' is required');
    res.json((await q(`UPDATE ${t} SET ${f.map((x, i) => x + '=$' + (i + 1))} WHERE ${id}=$${f.length + 1} RETURNING *`, [...f.map(x => req.body[x] || null), req.params.id]))[0]); }));
  app.delete('/api/' + k + '/:id', auth('admin'), H(async (req, res) => { await q(`DELETE FROM ${t} WHERE ${id}=$1`, [req.params.id]); res.json({ ok: true }); }));
});
app.listen(process.env.PORT || 5000, () => console.log('LibraX API on :' + (process.env.PORT || 5000)));
