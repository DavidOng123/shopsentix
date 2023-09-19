import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import api from './api';
import './profile.css';

export const Profile = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);

  const handleLogOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    console.log("Logged out");
    navigate('/');
  };

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          navigate('/');
          return;
        }

        const decodedToken = decodeAccessToken(accessToken);

        if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/');
          return;
        }

        const response = await api.get('http://localhost:4000/user-details', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setUserDetails(response.data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchUserDetails();
  }, [navigate]);

  const decodeAccessToken = (token) => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload;
    } catch (error) {
      return null;
    }
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
