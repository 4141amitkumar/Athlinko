import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import GoogleAuthProvider from './GoogleAuthProvider';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleAuthProvider>
    <App />
  </GoogleAuthProvider>
);