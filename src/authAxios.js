import axios from 'axios';

const authAxios = axios.create();

// Add an interceptor to include the access token with each request
authAxios.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Export the authAxios instance
export default authAxios;
