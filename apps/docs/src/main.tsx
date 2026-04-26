import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// library 的 tokens + core CSS；覆蓋在本地 reset 之上
import '@play-kit/games/styles.css';
import { App } from './App';
import './styles/reset.css';
import './styles/app.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
