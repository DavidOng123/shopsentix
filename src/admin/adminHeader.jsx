import React from 'react';
import { Link } from 'react-router-dom';
import './adminHeader.css'; 

const AdminHeader = () => {
  return (
    <header className="admin-header">
      <nav>
        <Link to="/admin/adminDashboard">Dashboard</Link>
        <Link to="/admin/productManagement">Products</Link>
        <Link to="/admin/inventory">Inventory</Link>
        <Link to="/admin/orderManagement">Orders</Link>
        <Link to="/admin/carouselManagement">Content</Link>
        <Link to="/admin/setting">Settings</Link>
      </nav>
    </header>
  );
};

export default AdminHeader;
