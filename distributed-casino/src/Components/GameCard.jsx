import React from 'react'

import { Link } from 'react-router-dom'

import "../Styles/custom.css";

function GameCard({ name, imageSrc, desc, linkUrl }) {
    return (
        <div className="card rounded col-3 m-2 p-3 rounded bg-secondary-subtle">
            <img
                src={imageSrc}
                className="card-img-top"
                alt="..."
                height="100px"
            ></img>
            <div className="card-body">
                <h5 className="card-title fw-semibold">{name}</h5>
                <p className="card-text">{desc}</p>
                <Link to={linkUrl} className="rounded">
                    Play
                </Link>
            </div>
        </div>
    );
}

export default GameCard;
