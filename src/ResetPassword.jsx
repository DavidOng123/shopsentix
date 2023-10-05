

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import './reset-password.css'; // Create a CSS file for styling the reset password page

export const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('http://localhost:4000/reset-password', formData); // Replace with your server endpoint
      setSuccessMessage('Password reset instructions sent to your email.');
    } catch (error) {
      setErrorMessage('Failed to send reset instructions. Please try again.');
    }
  };

  return (
    <div className='reset-password-container'>
      <h1>Reset Password</h1>
      <p>Enter your email to receive instructions on how to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <button type='submit'>Reset Password</button>
        {successMessage && <p className='success-message'>{successMessage}</p>}
        {errorMessage && <p className='error-message'>{errorMessage}</p>}
      </form>
      <p>
        Remember your password?{' '}
        <Link to='/login' style={{ color: 'blue', textDecoration: 'underline' }}>
          Log In
        </Link>
      </p>
    </div>
  );
};
