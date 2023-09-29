import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './adminDashboard.css';
import AdminHeader from './adminHeader'; 
import AdminFooter from './adminFooter';

export const AdminDashboard = () => {
  const [sentimentData, setSentimentData] = useState([]);

  useEffect(() => {
    // Fetch sentiment analysis data from your backend and update sentimentData state
    // Example API call: fetchSentimentAnalysisData()
    // Update sentimentData with the response data
  }, []);

  return (
    <div>
<AdminHeader/>
    
    <div className="admin-dashboard-container">
      
      <header>
        <h1>Admin Dashboard</h1>
      </header>
      <section className="dashboard-stats">
        <div className="stat-box">
          <h2>Total Sales</h2>
          <p>$10,000</p>
        </div>
        <div className="stat-box">
          <h2>Total Orders</h2>
          <p>100</p>
        </div>
        <div className="stat-box">
          <h2>Total Customers</h2>
          <p>500</p>
        </div>
      </section>
      <section className="sentiment-analysis">
        <h2>Sentiment Analysis</h2>
        {sentimentData.length === 0 ? (
          <p>Loading sentiment analysis data...</p>
        ) : (
          <ul>
            {sentimentData.map((item, index) => (
              <li key={index}>
                <strong>Product: {item.productName}</strong>
                <p>Sentiment: {item.sentiment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Function Buttons */}
      <section className="function-buttons">
        <Link to="/admin/productManagement">Manage Products</Link>
        <Link to="/admin/orders">Manage Orders</Link>
        <Link to="/admin/customers">Manage Customers</Link>
        <Link to="/admin/inventory">Inventory Management</Link>
        <Link to="/admin/promotions">Promotions & Discounts</Link>
        <Link to="/admin/reports">Reporting & Analytics</Link>
        <Link to="/admin/content">Content Management</Link>
        <Link to="/admin/settings">Settings</Link>
      </section>
      
    </div>
    <AdminFooter/>
    </div>
  );
};
