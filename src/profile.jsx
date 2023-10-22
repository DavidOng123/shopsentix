import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './profile.css';
import { useAuth } from './auth';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshAccessToken } = useAuth();
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

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
    if (activeTab === 'purchases') {
      // Make an API request to get the user's orders
      fetch(`http://localhost:4000/orders/${user?.id}`)
        .then((response) => response.json())
        .then(async (data) => {
          // Extract the items from the orders
          const items = data.reduce((allItems, order) => allItems.concat(order.items), []);
          const itemsWithNames = await Promise.all(
            items.map(async (item) => {
              const response = await fetch(`http://localhost:4000/products/${item.product}`);
              const productData = await response.json();
              return { ...item, productName: productData.name , image:productData.file_name};
            })
          );
  
          setPurchasedItems(itemsWithNames);
        })
        .catch((error) => {
          console.error('Error fetching purchased items:', error);
        });
    }
  }, [isAuthenticated, navigate, refreshAccessToken,activeTab, user?.id]);

  

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <Navbar />
      <div className='profile-wrapper'>
        <div className='profile-content'>
          <div>
            <div className='profile-tabs'>
              <button
                className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                Profile
              </button>
              <button
                className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => handleTabChange('edit')}
              >
                Edit Profile
              </button>
              <button
                className={`profile-tab ${activeTab === 'purchases' ? 'active' : ''}`}
                onClick={() => handleTabChange('purchases')}
              >
                Purchased Items
              </button>
            </div>
            {activeTab === 'profile' && (
              <div className='profile-details'>
                <h2>Welcome to your profile page, {user?.username}</h2>
                <p>Email: {user?.email}</p>
                <button className='logout-button' onClick={logout}>
                  Log Out
                </button>
              </div>
            )}
            {activeTab === 'edit' && (
              <div className='edit-profile'>
                {/* Add the form to edit user profile */}
                <h2>Edit Your Profile</h2>
                {/* Form fields for editing profile */}
              </div>
            )}
            {activeTab === 'purchases' && (
  <div className='purchased-items'>
    <h2>Your Purchased Items</h2>
    <ul>
      {purchasedItems.map((item, index) => (
        <li key={index}>
          <Link to={`/product/${item.product}`}>
          <div className="purchased-item">
            <div className="purchased-item-details">
              <strong>Product: {item.productName}</strong>
              
            <div className="product-image">
              {item.image && (
                <img
                  src={`http://localhost:4000/uploads/${item.image}`}
                  alt={item.productName}
                />
              )}
            </div>
              <p>Quantity: {item.quantity}</p>
              <p>Attribute: {item.attribute}</p>
            </div>
          </div>
          </Link>
        </li>
      ))}
    </ul>
  </div>
)}


          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
