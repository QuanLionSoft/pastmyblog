import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { initTheme } from './theme.js';
import './styles/global.css';
import './styles/components.css';
import './styles/admin.css';

// Tema tercihini ilk render'dan önce uygula (FOUC önlenir)
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
