import React from "react";
import "./navbarstyle.css";
import { Link } from 'react-router-dom';
import logoImage from "./Logo.png"; 

export const Navbar = () => {
  return (
    <div>
      <div id="main-navbar" className="navbar">
        <img src={logoImage} alt="Logo" className="logo" />
        <h1 style={{ paddingInlineEnd:'20px' }}>ShopSentix</h1>
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
          />
          <button className="search-button">&#128269;</button>
        </div>
        <nav>
          <ul>
            <li>
            <Link to="/">Home</Link>
            </li>
            <li>
              <a href="/">Favourite</a>
            </li>
            <li>
              <a href="/">Cart</a>
            </li>
            <li>
            <Link to="/login">Login | Sign Up</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
