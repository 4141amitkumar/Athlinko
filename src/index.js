import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css'; // Or './index.css' if that's your primary CSS file

// Removed the import for GoogleAuthProvider from './GoogleAuthProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Removed the <GoogleAuthProvider> wrapper
  <App />
);
