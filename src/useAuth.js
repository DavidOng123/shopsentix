import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export const useAuth = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setIsAuthenticated(false);
        navigate('/login'); 
      } else {
        try {
          const response = await api.get('http://localhost:4000/user-details', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.status === 200) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            navigate('/login');
          }
        } catch (error) {
          setIsAuthenticated(false);
          navigate('/login'); 
        }
      }
    };

    checkAuthentication();
  }, [navigate]);

  return isAuthenticated;
};
