import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(accessToken));

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:4000/token', {
        token: refreshToken,
      });
  
      const newAccessToken = response.data.accessToken;
      console.log('New Access Token:', newAccessToken);
      setAccessToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);
  
      // Fetch and update user details after token refresh
      const userDetailsResponse = await axios.get('http://localhost:4000/user-details', {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
  
      const updatedUser = userDetailsResponse.data;
      setUser(updatedUser);
  
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [refreshToken, setUser, setIsAuthenticated]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (accessToken) {
          const tokenExpiration = localStorage.getItem('tokenExpiration');
          const currentTime = Date.now() / 1000;
  
          if (tokenExpiration && currentTime > tokenExpiration) {
            await refreshAccessToken().then(()=>{console.log('Token updated')});
          }
  
          const response = await axios.get('http://localhost:4000/user-details', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
  
          const user = response.data;
          setUser(user);
          setIsAuthenticated(true);
          
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
  
    fetchData();
  }, [accessToken, refreshAccessToken]);
  



  async function login(email, password) {
    try {
      const response = await axios.post('http://localhost:4000/login', {
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data;
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      const expirationDurationInSeconds = 2 * 60 * 60; 
const tokenExpiration = Math.floor(Date.now() / 1000) + expirationDurationInSeconds;

localStorage.setItem('tokenExpiration', tokenExpiration);
      
      const userDetailsResponse = await axios.get('http://localhost:4000/user-details', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const user = userDetailsResponse.data; 
  
      setUser(user); 

     

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async function logout() {
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');

    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
