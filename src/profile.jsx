import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './profile.css';
import { useAuth } from './auth';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshAccessToken } = useAuth();
  const [tokenRefreshed, setTokenRefreshed] = useState(false);

  useEffect(() => {
    
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const currentTime = Date.now() / 1000;

      if (tokenExpiration && currentTime > tokenExpiration) {
        refreshAccessToken()
          .then(() => {
            setTokenRefreshed(true);
          })
          .catch((error) => {
            console.error('Token refresh failed:', error);
            navigate('/login');
          });
      }
    }
  }, [isAuthenticated, navigate, refreshAccessToken]);

  

  return (
    <div>
      <Navbar />
      <div className='profile-wrapper'>
        <div className='profile-content'>
          <div>
            {user || isAuthenticated? (
              <div className='profile-details'>
                <h2>Welcome to your profile page, {user?.username}</h2>
                <p>Email: {user?.email}</p>
                <button className='logout-button' onClick={logout}>
                  Log Out
                </button>
              </div>
            ) : (
              <div className='login-prompt'>
                <p>You need to log in to access this page.</p>
                <Link to="/login" className='login-link'>
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
