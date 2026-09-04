import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for Progressive Web App offline capabilities
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Notify PWAContext that an update is waiting
    window.dispatchEvent(
      new CustomEvent('disasterchain:swUpdate', { detail: registration })
    );
  },
  onSuccess: (registration) => {
    console.log('[DisasterChain] Service worker precache completed successfully.');
  },
});
