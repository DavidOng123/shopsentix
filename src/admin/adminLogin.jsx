import React, { useState } from 'react';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import './adminLogin.css'

export const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const { accessToken, refreshToken } = data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        window.location.href = '/admin/adminDashboard';
      } else {
        const data = await response.json();
        setError(data.message); // Display the error message
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again later.');
    }
  };

  return (
    <div className='adminwrapper'>
      <AdminHeader />
      <div className="admin-login-container">
        <h2>Admin Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
        />
        {error && <p className="error-message">{error}</p>}
        <button onClick={handleAdminLogin}>Login</button>
      </div>
      <AdminFooter />
    </div>
  );
};
