import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// 一行 import，整套 game CSS 自動帶進來
import '@play-kit/games/styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
