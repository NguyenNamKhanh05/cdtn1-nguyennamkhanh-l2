import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * Điểm vào của giao diện.
 *
 * Vì sao dùng `createRoot` và bundle sẵn bằng esbuild: giảng viên chỉ cần
 * `npm install && npm run setup && npm start` là mở được giao diện, không phải
 * cài thêm Vite/Webpack hay chạy song song một dev server. Mã nguồn JSX nằm
 * trong `web/src`, tệp build nằm ở `public/app.js` và đã được commit.
 */
const goc = document.getElementById('root');
createRoot(goc).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
