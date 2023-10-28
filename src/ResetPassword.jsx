

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './reset-password.css'; 

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
      const response = await fetch('http://localhost:4000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });
    
      if (response.status === 200) {
        const data = await response.json();
        setSuccessMessage(data.message);
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText);
      }
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
