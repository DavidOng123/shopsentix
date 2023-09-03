import React from "react";
import "./navbarstyle.css";

function Navbar  () {
  return (
    <div>
      <div id="main-navbar" className="navbar">
        <h2 className="logo">Logo</h2>
        <nav>
          <ul>
            <li>
              <a href="/home">Home</a>
            </li>
            <li>
              <a href="/home">Home</a>
            </li>
            <li>
              <a href="/home">Home</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
