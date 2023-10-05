import axios from 'axios';
import { useAuth } from './auth'; 



const api = axios.create({
  baseURL: 'http://localhost:4000', 
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { refreshAccessToken } = useAuth();
    if (error.response && error.response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          await refreshAccessToken(); // Call refreshAccessToken here
        // Retry the failed request
        return api.request(error.config);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      } else {
        console.error('Refresh token is missing.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
