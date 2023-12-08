import React from 'react'

import { withStore } from 'react-context-hook'

import Home from "./Windows/Home";
import Blackjack from "./Windows/Blackjack";
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

function App() {
    return <RouterProvider router={router} />;
}

const initialState = {
    account: null,
    funds: 0,
}

export default withStore(App, initialState)