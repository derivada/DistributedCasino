import React from 'react'

import { withStore } from 'react-context-hook'

import Home from "./Windows/Home";
import Blackjack from "./Windows/Blackjack";
import Dices from "./Windows/Dices";
import ErrorPage from "./Windows/404";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Statement from './Windows/Statement';


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
    {
        path: "/dices",
        element: <Dices />,
    },
    {
        path: "/statement",
        element: <Statement />,
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