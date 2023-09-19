import { Navbar } from './navbar';
import { Footer } from './Footer';
import React, { useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import './login.css'; 

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    const newErrors = {};
    
    if (formData.username.trim() === '') {
      newErrors.username = 'Username is required';
    }

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

    if (formData.confirmPassword.trim() === '') {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phoneNumber.trim() === '') {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (formData.address.trim() === '') {
      newErrors.address = 'Address is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      try {
        const { confirmPassword, ...userData } = formData;
        await api.post('http://localhost:4000/register', userData);
       
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          address: '',
        });
       
        setErrors({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          address: '',
        });
        console.log('Registration successful!');
        navigate('/login')
      } catch (error) {
        console.error(error);
        alert(error); 
      }
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phoneNumber) => {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
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
                <div className="title">REGISTRATION</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.username}</div>
                  </div>

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

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.confirmPassword}</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.phoneNumber}</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                    <div className="error">{errors.address}</div>
                  </div>

                  <button type="submit">Register</button>
                </form>
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
