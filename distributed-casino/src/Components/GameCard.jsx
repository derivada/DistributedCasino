import React from 'react'

import "../Styles/custom.css";

function GameCard({ name, imageSrc, desc, gameLink }) {
    return (
        <div className="card rounded col-3 m-2 p-3 rounded bg-secondary-subtle">
            <img src={imageSrc} className="card-img-top" alt="..." height="100px"></img>
            <div className="card-body">
                <h5 className="card-title fw-semibold">{name}</h5>
                <p className="card-text">{desc}</p>
                <a href={gameLink} className="btn btn-primary rounded">
                    Play
                </a>
            </div>
        </div>
    );
}

export default GameCard;
