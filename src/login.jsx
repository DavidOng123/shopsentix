import { Navbar } from './navbar';
import { Footer } from './Footer';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('accessToken');
    if (isAuthenticated) {
      navigate('/profile', { replace: true }); 
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: '',
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formData.email.trim() === '') {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.password.trim() === '') {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'Password should be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      try {
        const response = await axios.post('http://localhost:4000/login', formData);
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        console.log("Logged in");
        navigate('/profile', { replace: true })
      } catch (error) {
        console.error(error);
        // Handle login error
      }
    }

    setFormData({
      email: '',
      password: '',
    });

    setErrors({
      email: '',
      password: '',
    });
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className='wrapper'>
      <Navbar />

      <div className='content-container'>
        <div className='content'>
          <header className="main-header">
            <h1>Discover Amazing Products</h1>
            <p>Shop the latest trends with confidence</p>
          </header>
          <div className="container">
            <div className="materialContainer">
              <br></br>
              <br></br>
              <br></br>
              <div className="box">
                <div className="title">LOGIN</div>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.email}</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.password}</div>
                  </div>

                  <button type="submit">Login</button>
                </form>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'blue', textDecoration: 'underline' }}>
                    Register
                  </Link>
                </p>
              </div>
              <br></br>
              <br></br>
              <br></br>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
