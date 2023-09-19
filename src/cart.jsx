
import React from 'react';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './cart.css';

export const Cart = () =>{
  return (
    <div>
    <Navbar />
    <div className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-items">
        <div className="cart-item">
          <img src="item-image.jpg" alt="Product" />
          <div className="item-details">
            <h2>Product Name</h2>
            <p>Price: $XX.XX</p>
            <p>Quantity: 1</p>
          </div>
          <button className="remove-button">Remove</button>
        </div>
        {/* Additional cart items go here */}
      </div>
      <div className="total-price">
        <p>Total: $XX.XX</p>
      </div>
      <button className="checkout-button">Checkout</button>
    </div>
    <Footer />
  </div>
    
  );
};

