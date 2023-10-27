import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './cart.css';

export const Cart = () => {
  
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [unavailableItem, setUnavailableItem] = useState(null);
  const { accessToken, isAuthenticated, refreshAccessToken, user } = useAuth();
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  const isProductOutOfStock = (item) => {
    return item.details && item.details.quantity === 0;
  };

  useEffect( () => {
    if (!isAuthenticated) {
      const guestCartData = JSON.parse(localStorage.getItem('guestCart'))
      console.log('guestCartData:', guestCartData);
      

      async function fetchGuestCart() {
        if (guestCartData && guestCartData.items){
          const productIds = guestCartData.items.map((item) => item.product);
          console.log("productIds:"+productIds)
            const productDetails = await Promise.all(
              productIds.map(async (productId) => {
                const productResponse = await fetch(`http://localhost:4000/products/${productId}`, {
                  method: 'GET',
                });
      
                if (productResponse.ok) {
                  return productResponse.json();
                }
                return null;
              })
            );
      
            const populatedCart = guestCartData.items.map((item, index) => {
              const productDetail = productDetails[index];
              if (productDetail) {
                const updatedItem = {
                  ...item,  
                  details: productDetail,
                  imageUrl: `http://localhost:4000/uploads/${productDetail.file_name}`,
                };
            
                if (isProductOutOfStock(updatedItem)) {
                  updatedItem.outOfStock = true;
                }
            
                return updatedItem;
              }
              return null;
            });
            
        setCart({ items: populatedCart.filter((item) => item !== null), itemsUnavailable: [] });
        }
        
  
      }
      fetchGuestCart()

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
              const deletedProductId = cartData.itemsUnavailable;
  
              const fetchUnavailableProductDetails = async (productId) => {
                try {
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
                } catch (error) {
                  console.error('Error fetching product details:', error);
                  return null;
                }
              };
              
              const populateUnavailableItems = async () => {
                const unavailableItemDetails = await Promise.all(
                  deletedProductId.map((productId) => fetchUnavailableProductDetails(productId))
                );
              
                const populatedUnavailableItems = unavailableItemDetails
                  .filter((item) => item !== null)
                  .map((item, index) => ({
                    details: item,
                    imageUrl: `http://localhost:4000/uploads/${item.file_name}`,
                    // You can add other properties as needed.
                  }));
              
                return populatedUnavailableItems;
              };
              
              populateUnavailableItems().then((unavailableItems) => {
                console.log('Unavailable item details:', unavailableItems);
                // You can use unavailableItems as needed, e.g., to display them in your component.
                setUnavailableItem(unavailableItems);
              });
              
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
                  const updatedItem = {
                    ...item,
                    details: productDetail,
                    imageUrl: `http://localhost:4000/uploads/${productDetail.file_name}`,
                  };
              
                  if (isProductOutOfStock(updatedItem)) {
                    updatedItem.outOfStock = true;
                  }
              
                  return updatedItem;
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
    
      fetchCart()
      
    }

    if (isAuthenticated && user) {
      setFormData({
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
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

  const updateCartItem = async (index, updatedItem) =>{
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
  const removedItem = cart.items[index];

  if (isAuthenticated) {
    // Remove the item from the server-side cart for authenticated users
    try {
      const response = await fetch('http://localhost:4000/remove-from-cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: removedItem.product,
          attribute: removedItem.attribute,
        }),
      });

      if (response.ok) {
        // If the server successfully removed the item, update the cart in the state
        const updatedCart = [...cart.items];
        updatedCart.splice(index, 1);
        setCart({ items: updatedCart });
      } else {
        console.error('Error removing item from the cart:', response.status);
        // Handle the error (e.g., display an error message to the user)
      }
    } catch (error) {
      console.error('Error removing item from the cart:', error);
      // Handle the error (e.g., display an error message to the user)
    }
  } else {
   // Remove the item from the local storage for guest users
const updatedGuestCart = { ...JSON.parse(localStorage.getItem('guestCart')) };

if (updatedGuestCart.items && updatedGuestCart.items[index]) {
  // Remove the item from the local storage
  updatedGuestCart.items.splice(index, 1);

  // Update the local storage
  localStorage.setItem('guestCart', JSON.stringify(updatedGuestCart));

  // Update your component state
  setCart({ items: updatedGuestCart.items });
}

  }
};


  const calculateTotalPrice = () => {
    if (cart && cart.items) {
      let totalPrice = 0;

      cart.items.forEach((item) => {
        if (item.details && item.details.price) {
          // Only include items with a quantity greater than 0 in the total calculation
          if (item.details.quantity > 0  ) {
            if(item.details.quantity>=item.quantity)
            totalPrice += item.details.price * item.quantity;
          }
        }
      });

      return totalPrice.toFixed(2); // Round to 2 decimal places for currency
    }

    return '0.00';
  };

  const handleOpenConfirmation = () => {
    // Check if the cart contains items with a quantity greater than 0
    if (cart && cart.items.some(item => item.quantity > 0)) {
      setConfirmationOpen(true);
    }
  };

  const handleCloseConfirmation = () => {
    setConfirmationOpen(false);
  };

  const handleConfirmOrder = () => {
    // Check if the user is trying to order more items than available in the cart
    if (cart && cart.items.every(item => item.quantity <= item.details.quantity)) {
      setConfirmationOpen(false);
      setFormOpen(true);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    // Generate a random user ID for guest orders
    const guestUserId = generateRandomUserId();
  
    try {
      const cartItemsToOrder = cart.items.filter((item) => item.quantity > 0);
  
      const response = await fetch('http://localhost:4000/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user: isAuthenticated ? user.id : guestUserId,
          items: cartItemsToOrder,
          total: calculateTotalPrice(),
          shippingAddress: formData.address,
          isGuest:isAuthenticated ? false : true,
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
          console.log('Order placed successfully');
        }
        setFormOpen(false);
      } else {
        console.error('Error placing order:', response.status);
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };
  

  const generateRandomUserId = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const userIdLength = 24;
    let randomUserId = '';
  
    for (let i = 0; i < userIdLength; i++) {
      randomUserId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    return randomUserId;
  };

  const clearCart = () => {
    setCart({ items: [] });
    localStorage.removeItem('guestCart')
  };

  const handleGoBackToCart = () => {
    setFormOpen(false);
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
              <div
                className={`cart-item ${
                  isProductOutOfStock(item) ? 'out-of-stock' : item.details.quantity <= 3 && item.details.quantity > 0 ? 'low-stock' : ''
                }`}
                key={index}
              >
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
                  {isProductOutOfStock(item) && <p className="out-of-stock-message">Out of Stock</p>}
                  {item.details.quantity <= 3 || item.details.quantity < item.quantity && (
                    <p className="low-stock-message">Only {item.details.quantity} left</p>
                  )}
                </div>
              </div>
            ))}
          <div className="unavailable-items">
            {unavailableItem &&
              unavailableItem.map((item, index) => (
                <div className="unavailable-item" key={index}>
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
                    <p className="unavailable-message">Currently Unavailable</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="total-price">
          <p>Total: ${calculateTotalPrice()}</p>
        </div>
        <div className="checkout-container">
          <button className="checkout-button" onClick={handleOpenConfirmation}>
            Checkout
          </button>
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
                <label htmlFor="phone">Phone:</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
