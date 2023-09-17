import { Navbar } from './navbar';
import { Footer } from './Footer';
import React,{ useState } from 'react';

export const Register = () =>{
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
        // Clear the error message when the user starts typing
        setErrors({
          ...errors,
          [name]: '',
        });
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
    
        // Validate the form fields
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
    
        // If there are errors, set them and prevent form submission
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          // Form submission logic goes here
          // You can send the data to your server for registration
          // Reset form data
          setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            address: '',
          });
          // Clear errors
          setErrors({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            address: '',
          });
        }
      };
    
      const isValidEmail = (email) => {
        // Simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
    
      const isValidPhoneNumber = (phoneNumber) => {
        // Simple phone number validation regex (10 digits)
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
          <div class="materialContainer">
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
}
