import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'));
document.querySelector('body').setAttribute('data-bs-theme', 'dark'); // dark mode
root.render(
        <App />

);

