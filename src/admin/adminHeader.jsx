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
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/settings">Settings</Link>
      </nav>
    </header>
  );
};

export default AdminHeader;
