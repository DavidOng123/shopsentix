import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useUser } from './UserContext'; 
import './profile.css'; 

export const Profile = () => {
  const navigate = useNavigate();
  const userDetails = useUser(); // Access user details from the context

  const handleLogOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    console.log("Logged out");
    navigate('/');
  };

  return (
    <div>
      <Navbar />
      <div className='profile-wrapper'>
        <div className='profile-content'>
          <div>
            {userDetails ? (
              <div className='profile-details'>
                <h2>Welcome to your profile page, {userDetails.username}</h2>
                <p>Email: {userDetails.email}</p>
                <button className='logout-button' onClick={handleLogOut}>Log Out</button>
              </div>
            ) : (
              <div className='login-prompt'>
                <p>You need to log in to access this page.</p>
                <Link to="/login" className='login-link'>Log In</Link>
                <button className='logout-button' onClick={handleLogOut}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
