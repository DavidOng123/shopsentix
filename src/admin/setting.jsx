import React, { useState, useEffect } from 'react';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import { useAuth } from '../auth';
import './setting.css';

import { Link, useNavigate } from 'react-router-dom';
export const Setting = () => {
  const { user, login, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: '',
  });

  const [showForm, setShowForm] = useState(false); 

  const handleAdminLogin = async () => {
   
    setShowForm(true);
  };

  if (!isAdmin) {
    return (
      <div>
        <AdminHeader />
        <div className="admin-dashboard-container">
          <p>You don't have access to this page.</p>
          <Link to='/admin/adminLogin' style={{ color: 'blue', textDecoration: 'underline' }}>
    Login here.
  </Link>
          <Link></Link>
        </div>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader />
      <div className="admin-setting-page">
        
        <button onClick={handleAdminLogin}>Create Admin Account</button>

        {showForm && ( 
          <div className="admin-form">
            <h2>Create an Admin Account</h2>
            <input
              type="email"
              placeholder="Email"
              value={adminCredentials.email}
              onChange={(e) =>
                setAdminCredentials({
                  ...adminCredentials,
                  email: e.target.value,
                })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={adminCredentials.password}
              onChange={(e) =>
                setAdminCredentials({
                  ...adminCredentials,
                  password: e.target.value,
                })
              }
            />
            <button onClick={handleAdminLogin}>Create Admin Account</button>
          </div>
        )}

        <button onClick={logout}>Log Out</button>
      </div>
      <AdminFooter />
    </div>
  );
};
