import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Signal to the debug overlay that the app has mounted successfully
try {
  window.__PI_RA_CLIENT_MOUNTED__ = true;
} catch (e) {
  // ignore
}
