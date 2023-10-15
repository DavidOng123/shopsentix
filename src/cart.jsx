import React, { useEffect, useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './cart.css';

export const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const { accessToken,user, isAuthenticated, logout, refreshAccessToken } = useAuth();
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
    // Fetch the user's cart when the component mounts
    async function fetchCart() {
      try {
        const response = await fetch('http://localhost:4000/get-cart', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const cartData = await response.json();
          setCart(cartData);
        } else {
          console.error('Error fetching cart:', response.status);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }

    fetchCart();
  }, [isAuthenticated, navigate, refreshAccessToken]);

  return (
    <div>
      <Navbar />
      <div className="cart-page">
        <h1>Your Cart</h1>
        <div className="cart-items">
          {cart && cart.items.map((item, index) => (
            <div className="cart-item" key={index}>
              <div className="item-details">
                <h2>{item.product}</h2>
                <p>Price: ${item.product}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
              <button className="remove-button">Remove</button>
            </div>
          ))}
        </div>
        <div className="total-price">
          <p>Total:  0.00</p> 
        </div>
        <button className="checkout-button">Checkout</button>
      </div>
      <Footer />
    </div>
  );
};


