import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, LayoutDashboard, Library, Repeat, Bookmark, Wallet, Users, UserCog, LogOut, Moon, Sun, Search, Plus, Pencil, Trash2, Shield, UserCheck, User, X, Loader2, PenLine, Building2, Tags } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from './services/api';

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#f97316', '#ec4899', '#3b82f6'];
const fmt = d => (d ? String(d).slice(0, 10) : '—');
const useData = (path, deps = []) => {
  const [data, set] = useState(null); const [n, setN] = useState(0); const [e, setE] = useState('');
  useEffect(() => { let on = true; set(null); setE(''); api(path).then(d => on && set(d)).catch(x => { if (on) { set([]); setE(x.message) } }); return () => { on = false }; }, [path, n, ...deps]);
  return [data, () => setN(x => x + 1), e];
};
const Spinner = () => <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

function Table({ cols, rows, actions, pageSize = 8 }) {
  const [page, setPage] = useState(0); const [sort, setSort] = useState(null);
  if (!rows) return <Spinner />;
  if (!rows.length) return <div className="text-center text-slate-400 py-10">No records found</div>;
  let r = [...rows]; if (sort) r.sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.d);
  const pages = Math.ceil(r.length / pageSize), cur = Math.min(page, pages - 1);
  return <div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500">
    {cols.map(([k, l]) => <th key={k} className="p-2 cursor-pointer" onClick={() => setSort({ k, d: sort?.k === k ? -sort.d : 1 })}>{l}{sort?.k === k ? (sort.d > 0 ? ' ▲' : ' ▼') : ''}</th>)}{actions && <th />}</tr></thead>
    <tbody>{r.slice(cur * pageSize, cur * pageSize + pageSize).map((x, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50">
      {cols.map(([k]) => <td key={k} className="p-2">{/date/.test(k) ? fmt(x[k]) : String(x[k] ?? '—')}</td>)}{actions && <td className="p-2 flex gap-1 justify-end">{actions(x)}</td>}</tr>)}</tbody></table></div>
    <div className="flex justify-between items-center pt-3 text-xs text-slate-500"><span>{r.length} records</span><div className="flex gap-2 items-center">
      <button disabled={cur <= 0} onClick={() => setPage(cur - 1)} className="btn2 bg-slate-500 disabled:opacity-30">Prev</button>{cur + 1}/{pages}
      <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn2 bg-slate-500 disabled:opacity-30">Next</button></div></div></div>;
}
const Modal = ({ title, onClose, children }) => <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="card w-full max-w-lg max-h-[90vh] overflow-auto">
  <div className="flex justify-between mb-3"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose}><X /></button></div>{children}</div></div>;
const Btn = ({ c = 'bg-indigo-500', ...p }) => <button {...p} className={`btn2 ${c}`} />;

function Login({ onLogin }) {
  const [role, setRole] = useState('admin'); const [f, setF] = useState({ email: '', password: '' }); const [e, setE] = useState(''); const [busy, setBusy] = useState(false);
  const roles = [['admin', Shield, 'Admin'], ['staff', UserCheck, 'Staff'], ['member', User, 'Member']];
  const submit = async ev => { ev.preventDefault(); setBusy(true); setE('');
    try { const d = await api('/auth/login', { method: 'POST', body: { ...f, role } }); localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); onLogin(d.user); }
    catch (x) { setE(x.message) } setBusy(false); };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 !p-8 backdrop-blur">
      <div className="text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white"><BookOpen size={30} /></div>
        <h1 className="text-3xl font-extrabold mt-2 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">LibraX</h1><p className="text-sm text-slate-500">Library Management System</p></div>
      <div className="grid grid-cols-3 gap-2">{roles.map(([k, I, l]) => <button type="button" key={k} onClick={() => setRole(k)} className={`rounded-xl p-3 text-sm font-semibold flex flex-col items-center gap-1 border transition ${role === k ? 'bg-indigo-600 text-white border-indigo-600 scale-105' : 'border-slate-300 dark:border-slate-700'}`}><I size={20} />{l}</button>)}</div>
      <input className="inp" type="email" required placeholder={`${role} email`} value={f.email} onChange={x => setF({ ...f, email: x.target.value })} />
      <input className="inp" type="password" required placeholder="Password" value={f.password} onChange={x => setF({ ...f, password: x.target.value })} />
      {e && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg p-2">{e}</div>}
      <button className="btn w-full justify-center" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></div>;
}

const Stat = ({ l, v, g }) => <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${g} hover:-translate-y-1 hover:shadow-xl transition`}><div className="text-xs opacity-80">{l}</div><div className="text-2xl font-extrabold">{v}</div></div>;
function Dashboard() {
  const [d, , er] = useData('/dashboard'); if (er) return <div className="card text-red-600">Could not load dashboard: {er}</div>; if (!d || !d.stats) return <Spinner />; const s = d.stats;
  const st = [['Books', s.books, 'from-indigo-500 to-purple-500'], ['Copies', s.copies, 'from-blue-500 to-cyan-500'], ['Members', s.members, 'from-pink-500 to-rose-500'], ['Staff', s.staff, 'from-orange-500 to-amber-500'],
    ['Authors', s.authors, 'from-purple-500 to-fuchsia-500'], ['Publishers', s.publishers, 'from-cyan-500 to-teal-500'], ['Issued', s.issued, 'from-indigo-500 to-blue-500'], ['Available', s.available, 'from-emerald-500 to-green-500'],
    ['Pending Reservations', s.pending, 'from-orange-500 to-pink-500'], ['Unpaid Fines', '₹' + s.unpaid, 'from-red-500 to-orange-500'], ['Fines Collected', '₹' + s.collected, 'from-teal-500 to-cyan-500']];
  return <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{st.map(([l, v, g]) => <Stat key={l} l={l} v={v} g={g} />)}</div>
    <div className="grid lg:grid-cols-2 gap-5"><div className="card"><h3 className="font-bold mb-2">Monthly book issues</h3><ResponsiveContainer height={240}><BarChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" opacity={.3} /><XAxis dataKey="month" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="issues" fill="#6366f1" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="card"><h3 className="font-bold mb-2">Popular categories</h3><ResponsiveContainer height={240}><PieChart><Pie data={d.categories} dataKey="value" nameKey="name" outerRadius={90} label>{d.categories.map((_, i) => <Cell key={i} fill={COLORS[i % 6]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      <div className="card"><h3 className="font-bold mb-2">Recent transactions</h3><Table pageSize={5} cols={[['title', 'Book'], ['full_name', 'Member'], ['issue_date', 'Date']]} rows={d.recentIssues} /></div>
      <div className="card"><h3 className="font-bold mb-2">Recent members</h3><Table pageSize={5} cols={[['full_name', 'Name'], ['member_type', 'Type'], ['join_date', 'Joined']]} rows={d.recentMembers} /></div></div></div>;
}

function BookForm({ book, lk, onDone, toast }) {
  const [f, setF] = useState(book ? { ...book, author_names: book.authors || '' } : { isbn: '', title: '', publisher_id: '', category_id: '', publication_year: '', author_names: '', copies: 1 });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = async e => { e.preventDefault(); try { await api(book ? '/books/' + book.book_id : '/books', { method: book ? 'PUT' : 'POST', body: f }); toast('Book saved to PostgreSQL'); onDone(); } catch (x) { toast(x.message, 1) } };
  return <form onSubmit={save} className="space-y-3">
    <input className="inp" required placeholder="Title" value={f.title} onChange={e => set('title', e.target.value)} />
    <input className="inp" required placeholder="ISBN" value={f.isbn} onChange={e => set('isbn', e.target.value)} />
    <select className="inp" value={f.publisher_id || ''} onChange={e => set('publisher_id', e.target.value)}><option value="">Publisher…</option>{lk.publishers.map(p => <option key={p.publisher_id} value={p.publisher_id}>{p.publisher_name}</option>)}</select>
    <select className="inp" value={f.category_id || ''} onChange={e => set('category_id', e.target.value)}><option value="">Category…</option>{lk.categories.map(p => <option key={p.category_id} value={p.category_id}>{p.category_name}</option>)}</select>
    <input className="inp" type="number" placeholder="Publication year" value={f.publication_year || ''} onChange={e => set('publication_year', e.target.value)} />
    <input className="inp" placeholder="Author name(s) – separate several with commas" value={f.author_names} onChange={e => set('author_names', e.target.value)} />
    {book ? <input className="inp" type="number" min="0" placeholder="Add more copies" onChange={e => set('add_copies', e.target.value)} /> : <input className="inp" type="number" min="0" placeholder="Number of copies" value={f.copies} onChange={e => set('copies', e.target.value)} />}
    <button className="btn">Save</button></form>;
}
function Books({ role, toast }) {
  const [s, setS] = useState(''); const [cat, setCat] = useState(''); const [pub, setPub] = useState(''); const [modal, setModal] = useState(null);
  const [lk] = useData('/lookups'); const [rows, reload] = useData(`/books?search=${encodeURIComponent(s)}&category=${cat}&publisher=${pub}`, []);
  const can = role !== 'member';
  const del = async b => { if (!confirm(`Delete "${b.title}" and its copies?`)) return; try { await api('/books/' + b.book_id, { method: 'DELETE' }); toast('Deleted'); reload(); } catch (x) { toast(x.message, 1) } };
  const reserve = async b => { try { await api('/reservations', { method: 'POST', body: { book_id: b.book_id } }); toast('Reserved!'); } catch (x) { toast(x.message, 1) } };
  return <div className="card space-y-3"><div className="flex flex-wrap gap-2"><div className="relative flex-1 min-w-[180px]"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input className="inp !pl-9" placeholder="Search title, ISBN or author" value={s} onChange={e => setS(e.target.value)} /></div>
    {lk?.categories && <><select className="inp !w-auto" value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{lk.categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select>
      <select className="inp !w-auto" value={pub} onChange={e => setPub(e.target.value)}><option value="">All publishers</option>{lk.publishers.map(c => <option key={c.publisher_id} value={c.publisher_id}>{c.publisher_name}</option>)}</select></>}
    {can && <button className="btn" onClick={() => setModal({})}><Plus size={16} />Add book</button>}</div>
    <Table rows={rows} cols={[['book_id', 'ID'], ['isbn', 'ISBN'], ['title', 'Title'], ['authors', 'Author(s)'], ['publisher_name', 'Publisher'], ['category_name', 'Category'], ['publication_year', 'Year'], ['copies', 'Copies'], ['available', 'Avail.']]}
      actions={b => role === 'member' ? <Btn c="bg-pink-500" onClick={() => reserve(b)}>Reserve</Btn> : <><Btn onClick={() => setModal(b)}><Pencil size={12} /></Btn>{role === 'admin' && <Btn c="bg-red-500" onClick={() => del(b)}><Trash2 size={12} /></Btn>}</>} />
    {modal && lk?.authors && <Modal title={modal.book_id ? 'Edit book' : 'Add book'} onClose={() => setModal(null)}><BookForm book={modal.book_id ? modal : null} lk={lk} toast={toast} onDone={() => { setModal(null); reload(); }} /></Modal>}</div>;
}

function Circulation({ toast }) {
  const [copies, rc] = useData('/copies?status=Available'); const [members] = useData('/members'); const [issues, ri] = useData('/issues?active=1');
  const [f, setF] = useState({ copy_id: '', member_id: '' });
  const issue = async e => { e.preventDefault(); try { await api('/issue', { method: 'POST', body: f }); toast('Book issued'); setF({ copy_id: '', member_id: '' }); rc(); ri(); } catch (x) { toast(x.message, 1) } };
  const ret = async i => { try { const r = await api('/return/' + i.issue_id, { method: 'POST' }); toast(r.fine > 0 ? `Returned. Fine ₹${r.fine} recorded` : 'Returned'); rc(); ri(); } catch (x) { toast(x.message, 1) } };
  const gen = async () => { try { const r = await api('/fines/generate', { method: 'POST' }); toast(`${r.created} overdue fine(s) generated`); } catch (x) { toast(x.message, 1) } };
  return <div className="space-y-5"><form onSubmit={issue} className="card flex flex-wrap gap-2 items-end"><div className="flex-1 min-w-[200px]"><label className="text-xs">Available copy</label>
    <select required className="inp" value={f.copy_id} onChange={e => setF({ ...f, copy_id: e.target.value })}><option value="">Select…</option>{(copies || []).map(c => <option key={c.copy_id} value={c.copy_id}>#{c.copy_id} – {c.title}</option>)}</select></div>
    <div className="flex-1 min-w-[200px]"><label className="text-xs">Member</label><select required className="inp" value={f.member_id} onChange={e => setF({ ...f, member_id: e.target.value })}><option value="">Select…</option>{(members || []).map(m => <option key={m.member_id} value={m.member_id}>{m.full_name} ({m.email})</option>)}</select></div>
    <button className="btn">Issue book</button></form>
    <div className="card"><div className="flex justify-between mb-2"><h3 className="font-bold">Currently issued</h3><Btn c="bg-orange-500" onClick={gen}>Generate overdue fines</Btn></div>
      <Table rows={issues ? issues.map(i => ({ ...i, overdue: i.overdue ? 'OVERDUE' : '' })) : null} cols={[['issue_id', 'ID'], ['title', 'Book'], ['full_name', 'Member'], ['issue_date', 'Issued'], ['due_date', 'Due'], ['overdue', 'Status']]} actions={i => <Btn c="bg-emerald-500" onClick={() => ret(i)}>Return</Btn>} /></div></div>;
}
function Reservations({ role, toast }) {
  const [rows, rl] = useData('/reservations'); const set = async (r, status) => { try { await api('/reservations/' + r.reservation_id, { method: 'PATCH', body: { status } }); toast('Updated'); rl(); } catch (x) { toast(x.message, 1) } };
  return <div className="card"><Table rows={rows} cols={[['reservation_id', 'ID'], ['title', 'Book'], ...(role === 'member' ? [] : [['full_name', 'Member']]), ['reservation_date', 'Date'], ['status', 'Status']]}
    actions={r => r.status === 'Pending' && (role === 'member' ? <Btn c="bg-red-500" onClick={() => set(r, 'Cancelled')}>Cancel</Btn> : <><Btn c="bg-emerald-500" onClick={() => set(r, 'Fulfilled')}>Fulfil</Btn><Btn c="bg-red-500" onClick={() => set(r, 'Cancelled')}>Cancel</Btn></>)} /></div>;
}
function Fines({ role, toast }) {
  const [rows, rl] = useData('/fines'); const pay = async f => { try { await api(`/fines/${f.fine_id}/pay`, { method: 'PATCH' }); toast('Marked paid'); rl(); } catch (x) { toast(x.message, 1) } };
  return <div className="card"><Table rows={rows} cols={[['fine_id', 'ID'], ['title', 'Book'], ['full_name', 'Member'], ['amount', 'Amount ₹'], ['fine_date', 'Date'], ['payment_status', 'Status']]} actions={role !== 'member' && (f => f.payment_status === 'Unpaid' && <Btn c="bg-emerald-500" onClick={() => pay(f)}>Mark paid</Btn>)} /></div>;
}
const Simple = ({ path, cols }) => { const [r] = useData(path); return <div className="card"><Table rows={r} cols={cols} /></div>; };
function Profile() { const [m] = useData('/me'); return !m ? <Spinner /> : <div className="card max-w-md space-y-1">{Object.entries(m).map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1"><span className="text-slate-500">{k}</span><b>{/date/.test(k) ? fmt(v) : v}</b></div>)}</div>; }


class Boundary extends React.Component { state = { e: null }; static getDerivedStateFromError(e) { return { e } } componentDidUpdate(p) { if (p.k !== this.props.k && this.state.e) this.setState({ e: null }) }
  render() { return this.state.e ? <div className="card text-red-600">Something went wrong: {String(this.state.e.message)}</div> : this.props.children } }
function Crud({ path, idKey, fields, role, toast }) {
  const [rows, rl, er] = useData(path); const [m, setM] = useState(null);
  const save = async e => { e.preventDefault(); try { await api(m[idKey] ? `${path}/${m[idKey]}` : path, { method: m[idKey] ? 'PUT' : 'POST', body: m }); toast('Saved to PostgreSQL'); setM(null); rl(); } catch (x) { toast(x.message, 1) } };
  const del = async r => { if (!confirm('Delete this record?')) return; try { await api(`${path}/${r[idKey]}`, { method: 'DELETE' }); toast('Deleted'); rl(); } catch (x) { toast(x.message, 1) } };
  return <div className="card space-y-3">{er && <div className="text-red-600 text-sm">{er}</div>}<button className="btn" onClick={() => setM({})}><Plus size={16} />Add new</button>
    <Table rows={rows} cols={[[idKey, 'ID'], ...fields]} actions={r => <><Btn onClick={() => setM(r)}><Pencil size={12} /></Btn>{role === 'admin' && <Btn c="bg-red-500" onClick={() => del(r)}><Trash2 size={12} /></Btn>}</>} />
    {m && <Modal title={m[idKey] ? 'Edit' : 'Add'} onClose={() => setM(null)}><form onSubmit={save} className="space-y-3">{fields.map(([k, l], i) => <input key={k} className="inp" required={i === 0} placeholder={l} value={m[k] || ''} onChange={e => setM({ ...m, [k]: e.target.value })} />)}<button className="btn">Save</button></form></Modal>}</div>;
}
const NAV = {
  admin: [['dash', 'Dashboard', LayoutDashboard], ['books', 'Books', Library], ['circ', 'Issue / Return', Repeat], ['res', 'Reservations', Bookmark], ['fines', 'Fines', Wallet], ['members', 'Members', Users], ['authors', 'Authors', PenLine], ['publishers', 'Publishers', Building2], ['categories', 'Categories', Tags], ['staff', 'Staff', UserCog], ['hist', 'Issue Records', BookOpen]],
  staff: [['dash', 'Dashboard', LayoutDashboard], ['books', 'Books', Library], ['circ', 'Issue / Return', Repeat], ['res', 'Reservations', Bookmark], ['fines', 'Fines', Wallet], ['members', 'Members', Users]],
  member: [['books', 'Browse Books', Library], ['mine', 'My Issues & History', BookOpen], ['res', 'My Reservations', Bookmark], ['fines', 'My Fines', Wallet], ['me', 'Profile', User]] };
const issueCols = [['issue_id', 'ID'], ['title', 'Book'], ['issue_date', 'Issued'], ['due_date', 'Due'], ['return_date', 'Returned']];

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } });
  const [dark, setDark] = useState(localStorage.getItem('dark') === '1'); const [toastMsg, setToast] = useState(null);
  const nav = user ? NAV[user.role] : []; const [tab, setTab] = useState(null); const page = tab || nav[0]?.[0];
  const toast = useCallback((m, bad) => { setToast({ m, bad }); setTimeout(() => setToast(null), 3000); }, []);
  const toggle = () => { document.documentElement.classList.toggle('dark'); localStorage.setItem('dark', dark ? '0' : '1'); setDark(!dark); };
  if (!user) return <Login onLogin={u => { setUser(u); setTab(null); }} />;
  const logout = () => { localStorage.clear(); setUser(null); document.documentElement.classList.remove('dark'); };
  const views = { dash: <Dashboard />, books: <Books role={user.role} toast={toast} />, circ: <Circulation toast={toast} />, res: <Reservations role={user.role} toast={toast} />, fines: <Fines role={user.role} toast={toast} />,
    members: <Simple path="/members" cols={[['member_id', 'ID'], ['full_name', 'Name'], ['member_type', 'Type'], ['email', 'Email'], ['phone', 'Phone'], ['join_date', 'Joined'], ['max_issue_limit', 'Limit']]} />,
    staff: <Simple path="/staff" cols={[['staff_id', 'ID'], ['staff_name', 'Name'], ['role', 'Role'], ['email', 'Email'], ['hire_date', 'Hired']]} />,
    hist: <Simple path="/issues" cols={[...issueCols.slice(0, 2), ['full_name', 'Member'], ...issueCols.slice(2)]} />, authors: <Crud path="/authors" idKey="author_id" role={user.role} toast={toast} fields={[['author_name', 'Author name'], ['biography', 'Biography'], ['email', 'Email']]} />,
    publishers: <Crud path="/publishers" idKey="publisher_id" role={user.role} toast={toast} fields={[['publisher_name', 'Publisher name'], ['address', 'Address'], ['phone', 'Phone'], ['email', 'Email']]} />,
    categories: <Crud path="/categories" idKey="category_id" role={user.role} toast={toast} fields={[['category_name', 'Category name'], ['shelf_location', 'Shelf location']]} />, mine: <Simple path="/issues" cols={issueCols} />, me: <Profile /> };
  return <div className="min-h-screen md:flex">
    <aside className="md:w-60 md:min-h-screen bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-600 text-white p-3 flex md:flex-col gap-1 overflow-x-auto">
      <div className="hidden md:flex items-center gap-2 text-2xl font-extrabold p-3"><BookOpen />LibraX</div>
      {nav.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition hover:bg-white/20 ${page === k ? 'bg-white/25 font-bold' : ''}`}><I size={18} />{l}</button>)}</aside>
    <main className="flex-1 p-4 md:p-6 space-y-4"><header className="flex justify-between items-center"><div><h2 className="text-2xl font-extrabold">{nav.find(n => n[0] === page)?.[1]}</h2><p className="text-sm text-slate-500">{user.name} · {user.role}</p></div>
      <div className="flex gap-2"><button onClick={toggle} className="card !p-2">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button onClick={logout} className="card !p-2 flex gap-1 items-center text-sm"><LogOut size={18} />Logout</button></div></header>
      <Boundary k={page}>{views[page]}</Boundary></main>
    {toastMsg && <div className={`fixed bottom-4 right-4 z-[60] rounded-xl px-4 py-3 text-white shadow-xl ${toastMsg.bad ? 'bg-red-600' : 'bg-emerald-600'}`}>{toastMsg.m}</div>}</div>;
}
