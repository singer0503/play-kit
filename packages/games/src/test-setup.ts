import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom 不實作 HTMLCanvasElement.getContext，會在 stderr 噴 "Not implemented"。
// ScratchCard 等 canvas-based game 對 null ctx 都有 early return 守衛，
// 這裡 stub 成 null 讓 jsdom 安靜，不改變任何 runtime 行為。
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

// 每個 test 後清理掛載的 DOM
afterEach(() => {
  cleanup();
});
