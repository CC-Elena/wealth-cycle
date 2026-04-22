import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  // 注册 PWA Service Worker
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    registerSW({
      onNeedRefresh() {
        console.log('New content available, click to refresh');
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
  }
}
