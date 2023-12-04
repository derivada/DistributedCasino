import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./Components/Home.jsx";
import Navbar from "./Components/Navbar.jsx";

const links = [
  { name: 'Home', path: '/home' },
  { name: 'Play', path: '/play' },
  { name: 'Donate', path: '/donate' },
  { name: 'Wallet', path: '/wallet' },
];

function App() {
    return (
        <Router>
            <div>
                {/* Navbar */}
                <Navbar selectedLink={"Play"} links={links} />

                {/* Routes */}
                <Routes>
                  <Route path="/home" exact component={Home} />
                  {/* <Route path = "/donate" element={<Donate/>}/>
                      <Route path = "/wallet" element={<Wallet/>}/>
                      <Route path = "/nftshop" element={<NFTShop/>}/>
                      <Route path = "/transparency" element={<Transparency/>}/>
                      <Route path = "/games/coinflip" element={<Coinflip/>}/>
                      <Route path = "/games/roulette" element={<Roulette/>}/>
                      <Route path = "/games/nftstake" element={<NFTStake/>}/>
                      <Route path = "/games/pot" element={<Pot/>}/>
                      <Route path = "*" element={<NotFound/>}/> */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
