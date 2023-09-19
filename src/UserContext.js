import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          return;
        }

        const response = await api.get('http://localhost:4000/user-details', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setUserDetails(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await api.post('http://localhost:4000/token', {
                token: refreshToken,
              });

              const newAccessToken = refreshResponse.data.accessToken;
              localStorage.setItem('accessToken', newAccessToken);

              const retryResponse = await api.get('http://localhost:4000/user-details', {
                headers: {
                  Authorization: `Bearer ${newAccessToken}`,
                },
              });

              setUserDetails(retryResponse.data);
            } catch (refreshError) {
              console.error(refreshError);
            }
          } else {
            console.error("Refresh token is missing.");
          }
        } else {
          console.error(error);
        }
      }
    }

    fetchUserDetails();
  }, []);

  return (
    <UserContext.Provider value={userDetails}>
      {children}
    </UserContext.Provider>
  );
}
