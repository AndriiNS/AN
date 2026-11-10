import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';

// Fonts are bundled with the site (no Google Fonts request, better for GDPR)
import '@fontsource/wix-madefor-display/latin-700.css';
import '@fontsource/wix-madefor-display/cyrillic-700.css';
import '@fontsource/wix-madefor-display/latin-800.css';
import '@fontsource/wix-madefor-display/cyrillic-800.css';
import '@fontsource/wix-madefor-text/latin-400.css';
import '@fontsource/wix-madefor-text/cyrillic-400.css';
import '@fontsource/wix-madefor-text/latin-500.css';
import '@fontsource/wix-madefor-text/cyrillic-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';

import './i18n';
import './styles/main.scss';
import App from './App';

// The one-file preview build uses #/en style URLs, the real site uses /en
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;
const basename = import.meta.env.VITE_HASH_ROUTER ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  </React.StrictMode>,
);
