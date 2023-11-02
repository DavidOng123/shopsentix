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
  const [filterStatus, setFilterStatus] = useState('all'); 


  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setProfileData(user)
      const checkAndRefreshToken = async () => {
        const currentTime = Date.now() / 1000;
        const tokenExpiration = localStorage.getItem('tokenExpiration');
  
        if (tokenExpiration && currentTime > tokenExpiration) {
          try {
            await refreshAccessToken();
            setTokenRefreshed(true);
          } catch (error) {
            console.error('Token refresh failed:', error);
            navigate('/login');
          }
        }
      };
  
      checkAndRefreshToken();
      const tokenCheckInterval = 15 * 60 * 1000; 
      const tokenCheckIntervalId = setInterval(checkAndRefreshToken, tokenCheckInterval);

      const sortOrdersByTime = (orders) => {
        return orders.slice().sort((a, b) => {
          const timeA = new Date(a.orderDate);
          const timeB = new Date(b.orderDate);
          return timeB - timeA; 
        });
      };

      if (activeTab === 'purchases') {
        fetch(`http://localhost:4000/orders/${user?.id}`)
          .then((response) => response.json())
          .then(async (data) => {
            console.log('purchased item:' + data);
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
            const sortedOrders = sortOrdersByTime(ordersWithItems); 
            setOrders(sortedOrders);
          })
          .catch((error) => {
            console.error('Error fetching purchased items:', error);
          });
      }
     
      return () => {
        clearInterval(tokenCheckIntervalId);
      };
    
    }
    
  }, [isAuthenticated, navigate, refreshAccessToken, activeTab, user]);

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
          return response.json(); 
        } else {
          console.error(`Error updating profile ${field}:`, response.status);
          throw new Error(`Error updating profile ${field}`);
        }
      })
      .then((data) => {
        const { accessToken, refreshToken } = data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const expirationDurationInSeconds = 2 * 60 * 60;
        const tokenExpiration = Math.floor(Date.now() / 1000) + expirationDurationInSeconds;
        localStorage.setItem('tokenExpiration', tokenExpiration);
  
        console.log(`Profile ${field} updated successfully.`);
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
    setComment('');
    setShowCommentForm(true);

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
        await updateReviewStatus(reviewData.orderId, reviewData.productId);
        console.log('Review posted successfully.');
        setComment('');
        setShowCommentForm(false); 
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
            </div>
          )}
            {activeTab === 'purchases' && (
              <div className='purchased-items'>
                <h2>Your Purchased Items</h2>
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-button ${filterStatus === 'preparing' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('preparing')}
                  >
                    Preparing
                  </button>
                  <button
                    className={`filter-button ${filterStatus === 'processing' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('processing')}
                  >
                    Processing
                  </button>
                  <button
                    className={`filter-button ${filterStatus === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('completed')}
                  >
                    Completed
                  </button>
                </div>
                <br></br><br></br>
                <div className="purchased-items-container">
  {orders
    .filter((order) => {
      if (filterStatus === 'all') return true;
      return order.status.toLowerCase() === filterStatus;
    })
    .map((order, orderIndex) => (
      <div key={orderIndex} className="purchased-item-box">
        <div className='order-details'>
          <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
          <p>Order Status: {order.status}</p>
        </div>
        <div className='purchased-items-list'>
          {order.items.map((item, itemIndex) => (
            <div key={itemIndex} className="purchased-item">
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
                <p>Total: ${order.total}</p>
                {order.status === 'completed' && !item.isReviewed &&(
                  <>
                    <button className='comment-button' onClick={() => handleLeaveReview(order._id, item.product)}>
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
          ))}
        </div>
        {order.status !== 'completed' && (
          <button onClick={() => markOrderAsReceived(order._id)} className='mark-received-button'>
            Mark Received
          </button>
        )}
      </div>
    ))}
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
