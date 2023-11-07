import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import './carouselManagement.css';

export const CarouselManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [items, setItems] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 

  const handleAddItem = () => {
    fetch('http://localhost:4000/addCarousel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, caption }),
    })
      .then((response) => {
        if (response.ok) {
          setItems([...items, { imageUrl, caption }]);
          setImageUrl('');
          setCaption('');
          setSuccessMessage('Item added successfully.'); 
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      })
      .catch((error) => {
        setSuccessMessage('Failed to add item.');
      });
  };

  const handleDeleteItem = (id) => {
    fetch(`http://localhost:4000/deleteCarousel/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) {
          setItems(items.filter((item) => item._id !== id));
          setSuccessMessage('Item deleted successfully.');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      })
      .catch((error) => {
        setSuccessMessage('Failed to delete item.');
      });
  };

  useEffect(() => {
    fetch('http://localhost:4000/getCarousel')
      .then((response) => response.json())
      .then((data) => {
        setItems(data);
      })
      .catch((error) => {
        setSuccessMessage('Failed to fetch items.'); 
      });
  }, []);

  if (!isAdmin) {
    return (
      <div>
        <AdminHeader />
        <div className="admin-dashboard-container">
          <p>You don't have access to this page.</p>
        </div>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader />
    <div className="carousel-management">
      
      <h1>Carousel Management</h1>
      <input
        type="text"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button onClick={handleAddItem}>Add Item</button>
      {successMessage && <div className="success-message">{successMessage}</div>}
      <ul className="carousel-list">
        {items.map((item) => (
          <li key={item._id} className="carousel-item">
            <img src={item.imageUrl} alt={item.caption} className="carousel-image" />
            <p className="carousel-caption">{item.caption}</p>
            <button onClick={() => handleDeleteItem(item._id)} className="delete-button">
              Delete
            </button>
          </li>
        ))}
      </ul>
      
    </div>
    <AdminFooter />
    </div>
  );
};
