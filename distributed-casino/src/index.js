import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Home from './Windows/Home';
import Blackjack from './Windows/Blackjack';
import ErrorPage from "./Windows/404";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/blackjack",
        element: <Blackjack />,
    },

]);

const root = ReactDOM.createRoot(document.getElementById('root'));
document.querySelector('body').setAttribute('data-bs-theme', 'dark'); // dark mode
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
        {/*<App />*/}
    </React.StrictMode>
);

