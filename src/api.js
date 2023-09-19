import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', 
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:4000/token', {
            token: refreshToken,
          });

          const newAccessToken = response.data;
          localStorage.setItem('accessToken', newAccessToken);

          
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios.request(error.config);
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
