import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider,useAuth } from './auth'; 
import axios from 'axios'; 

import { Home } from './home';
import { Login } from './login';
import { Register } from './register';
import { Profile } from './profile';
import { Cart } from './cart';
import { ProductDetail } from './productDetail';
import { Product } from './product';
import { Favorite } from './favorite';
import { ResetPassword } from './ResetPassword';
import { Inventory } from './admin/inventory';
import { Setting } from './admin/setting';
import { AdminDashboard } from './admin/adminDashboard';
import { ProductManagement } from './admin/productManagement';
import { OrderManagement } from './admin/orderManagement';
import { EditProduct } from './admin/editProduct';
import { AdminLogin } from './admin/adminLogin';
import CheckoutForm from "./Component/Checkout"
import { CarouselManagement } from './admin/carouselManagement';


function App() {
  const { refreshAccessToken, refreshToken } = useAuth(); 

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
      
        if (refreshToken) {
          try {
            // Call your refresh token logic here using the refreshAccessToken function
            const newAccessToken = await refreshAccessToken();

            if (newAccessToken) {
              // Retry the failed request with the new access token
              error.config.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios.request(error.config);
            } else {
              console.error('Token refresh failed.');
            }
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
          <Route path='/product' element={<Product />} />
          <Route path='/product/:id' element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path='/resetpassword' element={<ResetPassword />} />
          <Route path='/admin/adminDashboard' element={<AdminDashboard />} />
          <Route path='/admin/inventory' element={<Inventory />} />
          <Route path='/admin/productManagement' element={<ProductManagement />} />
          <Route path='/admin/orderManagement' element={<OrderManagement />} />
          <Route path='/admin/setting' element={<Setting />} />
          <Route path='/admin/editProduct/:id' element={<EditProduct />} />
          <Route path='/admin/adminLogin' element={<AdminLogin />} />
          <Route exact path='checkout/' index element={<CheckoutForm />} />
          <Route path='/admin/carouselManagement' element={<CarouselManagement />} />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
