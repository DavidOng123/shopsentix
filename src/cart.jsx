import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './cart.css';

export const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const { accessToken, isAuthenticated, refreshAccessToken } = useAuth();
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

          if (cartData && cartData.items) {
            const productIds = cartData.items.map((item) => item.product);

            const productDetails = await Promise.all(
              productIds.map(async (productId) => {
                const productResponse = await fetch(`http://localhost:4000/products/${productId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                });

                if (productResponse.ok) {
                  return productResponse.json();
                }
                return null;
              })
            );

            const populatedCart = cartData.items.map((item, index) => {
              const productDetail = productDetails[index];
              if (productDetail) {
                return {
                  ...item,
                  details: productDetail,
                  imageUrl: `http://localhost:4000/uploads/${productDetail.file_name}`,
                };
              }
              return null;
            });

            setCart({ items: populatedCart.filter(item => item !== null) });
          }
        } else {
          console.error('Error fetching cart:', response.status);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }

    fetchCart();
  }, [isAuthenticated, navigate, refreshAccessToken]);

  const handleQuantityChange = async (index, newQuantity) => {
    if (newQuantity < 0) {
      newQuantity = 0;
    }

    const updatedCart = [...cart.items];
    updatedCart[index].quantity = newQuantity;
    setCart({ items: updatedCart });

    try {
      const response = await fetch('http://localhost:4000/update-cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: updatedCart[index].product,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
      } else {
        console.error('Error updating cart:', response.status);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const handleRemoveItem = async (index) => {
    const updatedCart = [...cart.items];
    updatedCart.splice(index, 1);
    setCart({ items: updatedCart });

    try {
      const response = await fetch('http://localhost:4000/add-to-cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: cart.items[index].product,
          quantity: 0,
        }),
      });

      if (response.ok) {
      } else {
        console.error('Error updating cart:', response.status);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const calculateTotalPrice = () => {
    if (cart && cart.items) {
      let totalPrice = 0;

      cart.items.forEach((item) => {
        if (item.details && item.details.price) {
          totalPrice += item.details.price * item.quantity;
        }
      });

      return totalPrice.toFixed(2); // Round to 2 decimal places for currency
    }

    return '0.00';
  };

  return (
    <div>
      <Navbar />
      <div className="cart-page">
        <h1>Your Cart</h1>
        <div className="cart-items">
          {cart && cart.items.map((item, index) => (
            <div className="cart-item" key={index}>
              <img src={item.imageUrl} alt={item.details ? item.details.name : 'Product Name Not Available'} />
              <div className="item-details">
                <h2>{item.details ? item.details.name : 'Product Name Not Available'}</h2>
                <p>Price: ${item.details ? item.details.price : 'Price Not Available'}</p>
                <div className="quantity-control">
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />
                </div>
                <button className="remove-button" onClick={() => handleRemoveItem(index)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="total-price">
          <p>Total: ${calculateTotalPrice()}</p>
        </div>
        <div className="checkout-container">
          <button className="checkout-button">Checkout</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};
