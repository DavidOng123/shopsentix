import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './profile.css';
import { useAuth } from './auth';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshAccessToken, accessToken } = useAuth();
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [comment, setComment] = useState(''); 
  const [showCommentForm, setShowCommentForm] = useState(false); 
  const [reviewData, setReviewData] = useState({ orderId: '', productId: '' });
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setProfileData(user)
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
          const ordersWithItems = await Promise.all(
            data.map(async (order) => {
              const items = order.items;
              const itemsWithNames = await Promise.all(
                items.map(async (item) => {
                  const response = await fetch(`http://localhost:4000/products/${item.product}`);
                  const productData = await response.json();
                  return { ...item, productName: productData.name, image: productData.file_name };
                })
              );
              return { ...order, items: itemsWithNames };
            })
          );
          setOrders(ordersWithItems);
        })
        .catch((error) => {
          console.error('Error fetching purchased items:', error);
        });
    }
  }, [isAuthenticated, navigate, refreshAccessToken, activeTab, user?.id]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProfileChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });

    updateProfileInDatabase(field, value);
  };

  const updateProfileInDatabase = (field, value) => {
    // Send a PATCH request to update the profile data on the server
    fetch('http://localhost:4000/update-profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ [field]: value }),
    })
      .then((response) => {
        if (response.ok) {
          console.log(`Profile ${field} updated successfully.`);
        } else {
          console.error(`Error updating profile ${field}:`, response.status);
        }
      })
      .catch((error) => {
        console.error(`Error updating profile ${field}:`, error);
      });
  };


  const markOrderAsReceived = async (orderId) => {
    try {
      await fetch(`http://localhost:4000/update-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus: 'completed' }),
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: 'completed' } : order
        )
      );
    } catch (error) {
      console.error('Error marking order as received:', error);
    }
  };

  const handleLeaveReview = (orderId, productId) => {
    // Set the comment state and display a comment form
    setComment('');
    setShowCommentForm(true);

    // Save order and product IDs for later use
    setReviewData({ orderId, productId });
  };

  const handleSubmitReview = async () => {
    try {
      const response = await fetch('http://localhost:4000/post-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: reviewData.productId,
          comment: comment,
        }),
      });

      if (response.ok) {
        // After posting a review successfully, update the review status
        await updateReviewStatus(reviewData.orderId, reviewData.productId);
        console.log('Review posted successfully.');
        setComment('');
        setShowCommentForm(false); // Close the comment form
      } else {
        console.error('Error posting review:', response.status);
      }
    } catch (error) {
      console.error('Error posting review:', error);
    }
  };

  const updateReviewStatus = async (orderId, productId) => {
    try {
      const response = await fetch(`http://localhost:4000/update-review-status/${orderId}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isReviewed: true }),
      });

      if (!response.ok) {
        console.error('Error updating review status:', response.status);
      }
    } catch (error) {
      console.error('Error updating review status:', error);
    }
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
              <h2>Edit Your Profile</h2>
              <div>
                <label htmlFor='username'>Username:</label>
                <input
                  type='text'
                  name='username'
                  value={profileData.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor='address'>Address:</label>
                <input
                  type='text'
                  name='address'
                  value={profileData.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor='phone'>Phone:</label>
                <input
                  type='text'
                  name='phone'
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
              {/* Add more form fields for other profile information */}
            </div>
          )}
            {activeTab === 'purchases' && (
              <div className='purchased-items'>
                <h2>Your Purchased Items</h2>
                <div className="purchased-items-container">
                <ul>

                  {orders.map((order, orderIndex) => (
                    <li key={orderIndex}>
                      <div className='order-details'>
                        <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                        <p>Order Status: {order.status}</p>
                      </div>
                      <ul className='purchased-items-list'>
                        {order.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                              <div className='purchased-item'>
                                <div className='purchased-item-details'>
                                  <strong>Product: {item.productName}</strong>
                                  <div className='product-image'>
                                    {item.image && (
                                      <img
                                        src={`http://localhost:4000/uploads/${item.image}`}
                                        alt={item.productName}
                                      />
                                    )}
                                  </div>
                                  <p>Quantity: {item.quantity}</p>
                                  <p>Attribute: {item.attribute}</p>
                                  {order.status === 'completed' && !item.isReviewed && (
                                    <>
                                      <button onClick={() => handleLeaveReview(order._id, item.product)}>
                                        Leave Review
                                      </button>
                                      {item.isReviewed && (
  <p>You've already left a review for this product.</p>
)}
                                      {showCommentForm && reviewData.orderId === order._id && reviewData.productId === item.product && (
                                        <div className='comment-form'>
                                          <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder='Write your review here...'
                                          />
                                          <button onClick={handleSubmitReview}>Submit Review</button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                          </li>
                        ))}
                      </ul>
                      {order.status !== 'completed' && (
                        <button onClick={() => markOrderAsReceived(order._id)} className='mark-received-button'>
                          Mark Received
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
