import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth'; // Import your AuthProvider here
import axios from 'axios'; // Import axios here

import { Home } from './home';
import { Login } from './login';
import { Register } from './register';
import { Profile } from './profile';
import { Cart } from './cart';
import { ResetPassword } from './ResetPassword';
import { AdminDashboard } from './admin/adminDashboard';
import { ProductManagement } from './admin/productManagement';

function App() {
  // Set up axios interceptors for token refresh
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            // Call your refresh token logic here
            const response = await axios.post('http://localhost:4000/token', {
              token: refreshToken,
            });

            const newAccessToken = response.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);

            // Retry the failed request
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

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path='/resetpassword' element={<ResetPassword />} />
          <Route path='/admin/adminDashboard' element={<AdminDashboard />} />
          <Route path='/admin/productManagement' element={<ProductManagement />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
