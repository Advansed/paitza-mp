import React from 'react';
import { createRoot } from 'react-dom/client';
import { i18nReady } from './i18n';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
void i18nReady.then(() => {
  root.render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );
});