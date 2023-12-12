import React from 'react'


import "../Styles/Home.css";
import "../Styles/custom.css";
import GameCard from '../Components/GameCard';
import Navbar from '../Components/Navbar';
import FundsControl from '../Components/FundsControl';

function Statement() {
    return (
        <div>
            <Navbar selectedLink="Statement" />
            <div className="container m-5">
                <h3>
                    Why <span className="fw-light">AllInCasino</span>?
                </h3>
                <p className="border-top py-3 border-secondary">
                    The usage of <span class="text-primary fw-semibold">Smart Contracts</span> is very interesting in all contexts where money is handled between <strong>different parties that don't trust each other.</strong>
                </p>
                <h3>
                    What guarantees do  <span className="fw-light">Smart Contracts</span> give?
                </h3>
                <p className="border-top py-3 border-secondary">
                    <ol>
                        <li>
                            <strong>Transparency:</strong> Our smart contracts are fully <span class="text-primary fw-semibold"> open source, transparent and well documented</span>. All game possibilities are reflected in them, allowing for users to see that the outcomes are fair in every case. 
                        </li>
                        <li>
                            <strong>Trust:</strong> With decentralized smart contracts, there's <span class="text-primary fw-semibold">no need to rely on a central authority</span>. Trust is built into the code, ensuring that the rules of the game are executed precisely as intended, without the possibility of manipulation.
                        </li>
                        <li>
                            <strong>Anonymity:</strong> The usage of <span class="text-primary fw-semibold">account addresses</span> provides a big deegree of anonimity that traditional casinos don't allow for.
                        </li>
                        <li>
                            <strong>Security:</strong> Our platform prioritizes the security of your funds and personal information. <span class="text-primary fw-semibold">Blockchain's cryptographic principles</span> ensure that your data is secure and transactions are tamper-proof.
                        </li>
                        <li>
                            <strong>Global Accessibility:</strong> Since Smart Contracts are deployed in the global Ethreum blockchain, they can be accessed from <span class="text-primary fw-semibold"> any part of the world</span>. Enjou playing even when your government or bank wouldn't allow for!
                        </li>
                    </ol>
                </p>
                <h3>
                    Is this   <span className="fw-light">legal</span>?
                </h3>
                <p className="border-top py-3 border-secondary">
                    <span class="text-primary fw-semibold">Probably not</span>, but this is just an assignment so yeah.
                </p>
            </div>
        </div>
    );
}
export default Statement;
