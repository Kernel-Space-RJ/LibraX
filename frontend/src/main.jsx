import React from 'react'; import { createRoot } from 'react-dom/client'; import App from './App.jsx'; import './index.css';
if (localStorage.getItem('dark') === '1') document.documentElement.classList.add('dark');
createRoot(document.getElementById('root')).render(<App />);
