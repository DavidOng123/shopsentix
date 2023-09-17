import React from "react";
import "./navbarstyle.css";
import logoImage from "./Logo.png"; // Replace with the path to your logo image

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
              <a href="/home">Home</a>
            </li>
            <li>
              <a href="/home">Favourite</a>
            </li>
            <li>
              <a href="/home">Cart</a>
            </li>
            <li>
              <a href="/home">Login | Sign Up</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
