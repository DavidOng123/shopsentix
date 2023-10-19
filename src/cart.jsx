import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './cart.css';

export const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const { accessToken, isAuthenticated, refreshAccessToken, user } = useAuth();
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });


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
            Authorization: `Bearer ${accessToken}`,
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
                    Authorization: `Bearer ${accessToken}`,
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

            setCart({ items: populatedCart.filter((item) => item !== null) });
          }
        } else {
          console.error('Error fetching cart:', response.status);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }
  

    fetchCart();
    if (isAuthenticated && user) {
      setFormData({
        name: user.username || '',
        email: user.email || '',
        address: user.address || '',
      });
    }
  }, [isAuthenticated, navigate, refreshAccessToken]);

  const handleQuantityChange = async (index, newQuantity) => {
    if (newQuantity < 0) {
      newQuantity = 0;
    }

    const updatedCart = [...cart.items];
    updatedCart[index].quantity = newQuantity;
    setCart({ items: updatedCart });

    updateCartItem(index, updatedCart[index]);
  };

  const handleAttributeChange = async (index, newAttribute) => {
    const updatedCart = [...cart.items];

    if (updatedCart[index]) {
      // Check if the item at the specified index exists
      updatedCart[index].attribute = newAttribute;
      setCart({ items: updatedCart });

      // Send a request to update the cart item's attribute on the server
      updateCartItem(index, updatedCart[index]);
    }
  };

  const updateCartItem = async (index, updatedItem) => {
    try {
      const response = await fetch('http://localhost:4000/update-cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: updatedItem.product,
          quantity: updatedItem.quantity,
          attribute: updatedItem.attribute, // Include the updated attribute
        }),
      });

      if (response.ok) {
        // Handle successful response
      } else {
        console.error('Error updating cart:', response.status);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const handleRemoveItem = async (index) => {
    // const updatedCart = [...cart.items];
    // updatedCart.splice(index, 1);
    // setCart({ items: updatedCart });

    // // Send a request to remove the item from the server-side cart
    // const removedItem = cart.items[index];
    // try {
    //   const response = await fetch('http://localhost:4000/remove-from-cart', {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       productId: removedItem.product,
    //       attribute: removedItem.attribute,
    //     }),
    //   });

    //   if (response.ok) {
    //     // Handle successful response
    //   } else {
    //     console.error('Error removing item from the cart:', response.status);
    //   }
    // } catch (error) {
    //   console.error('Error removing item from the cart:', error);
    // }
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

  
  const handleOpenConfirmation = () => {
    setConfirmationOpen(true);
  };

  const handleCloseConfirmation = () => {
    setConfirmationOpen(false);
  };

  const handleConfirmOrder = () => {
    setConfirmationOpen(false);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:4000/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user: user.id, // Include user information
          items: cart.items, // Include the items in the cart
          total:calculateTotalPrice(),
          shippingAddress: formData.address, // Include shipping address
        }),
      });
  
      if (response.ok) {
        clearCart();

        const clearCartResponse = await fetch('http://localhost:4000/clear-cart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        if (clearCartResponse.ok) {
          // Cart cleared successfully on the server
          console.log('Order placed successfully');}
      setFormOpen(false);
      } else {
        console.error('Error placing order:', response.status);
        // Handle the error (e.g., display an error message to the user)
      }
    } catch (error) {
      console.error('Error placing order:', error);
      // Handle the error (e.g., display an error message to the user)
    }
  };

  const clearCart = () => {
    // Assuming you have a way to clear the cart in your state management.
    // Replace this with the appropriate logic for your application.
    setCart({ items: [] });
  };
  
  const handleGoBackToCart = () => {
    setFormOpen(false);
    // You can use the `navigate` function to go back to the cart page
    navigate('/cart');
  };

  

  return (
    <div>
      <Navbar />
      <div className="cart-page">
        <h1>Your Cart</h1>
        <div className="cart-items">
          {cart &&
            cart.items.map((item, index) => (
              <div className="cart-item" key={index}>
                <img
                  src={item.imageUrl}
                  alt={item.details ? item.details.name : 'Product Name Not Available'}
                />
               <div className="item-details">
  <div className="item-details-header">
    <h2 className="product-name">
      {item.details ? item.details.name : 'Product Name Not Available'}
    </h2>
    <p className="product-price">
      Price: ${item.details ? item.details.price : 'Price Not Available'}
    </p>
  </div>
  <div className="item-details-controls">
    <div className="attribute-control">
      <label htmlFor={`attribute-select-${index}`}>Attribute:</label>
      <select
        id={`attribute-select-${index}`}
        className="attribute-select"
        value={item.attribute}
        onChange={(e) => handleAttributeChange(index, e.target.value)}
      >
        {item.details.attributes.map((attribute) => (
          <option key={attribute} value={attribute}>
            {attribute}
          </option>
        ))}
      </select>
    </div>
    <div className="quantity-control">
      <label htmlFor={`quantity-input-${index}`}>Quantity:</label>
      <input
        id={`quantity-input-${index}`}
        type="number"
        min="0"
        value={item.quantity}
        onChange={(e) => handleQuantityChange(index, e.target.value)}
        className="quantity-input"
      />
    </div>
    <button className="remove-button" onClick={() => handleRemoveItem(index)}>
      Remove
    </button>
  </div>
</div>

              </div>
            ))}
        </div>
        <div className="total-price">
          <p>Total: ${calculateTotalPrice()}</p>
        </div>
        <div className="checkout-container">
          <button className="checkout-button"  onClick={handleOpenConfirmation}>Checkout</button>
        </div>
      </div>
      <Footer />
      {isConfirmationOpen && (
         <div className="overlay">
         <div className="confirmation-dialog">
           <h2>Confirm Your Order</h2>
           <p>Are you sure you want to proceed with this order?</p>
           <button className="confirm-button" onClick={handleConfirmOrder}>
             Yes, Confirm
           </button>
           <button className="cancel-button" onClick={handleCloseConfirmation}>
             Cancel
           </button>
         </div>
       </div>
      )}
      {isFormOpen && (
        <div className="overlay">
          <div className="form-dialog">
  <h2>Enter Your Information</h2>
  <form onSubmit={handleFormSubmit}>
    <div className="form-group">
      <label htmlFor="name">Name:</label>
      <input
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </div>
    <div className="form-group">
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>
    <div className="form-group">
      <label htmlFor="address">Address:</label>
      <input
        type="text"
        id="address"
        name="address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />
    </div>
    <div className="form-buttons">
        <button className="back-button" onClick={handleGoBackToCart}>
          Back to Cart
        </button>
        <button className="submit-button" onClick={handleFormSubmit}>
          Submit
        </button>
      </div>
  </form>
</div>

        </div>
      )}
    </div>
  );
};
