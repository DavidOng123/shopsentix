import React from "react";
import { Link } from "react-router-dom"; 
import "./footerstyle.css";

export const Footer = () => {
  return (
    <div>
      <div className="footer">
        <p>&copy; 2023 ShopSentix</p>
        <Link to="/admin-login">Admin Login</Link> 
      </div>
    </div>
  );
};
