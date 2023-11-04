import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './favorite.css';

export const Favorite = () => {
  const { user, accessToken } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:4000/favorites', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const favoritesData = await response.json();
        setFavorites(favoritesData);
      } else {
        console.error('Error fetching favorites:', response.status);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      const response = await fetch(`http://localhost:4000/remove-favorite/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const updatedFavorites = favorites.filter((favorite) => favorite._id !== productId);
        setFavorites(updatedFavorites);
        setSuccessMessage('Removed from favorites successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('Error removing from favorites:', response.status);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="favorite-page">
        <h1 className="favorite-title">My Favorites</h1>
        {successMessage && <div className="success-message">{successMessage}</div>}
        <div className="favorite-grid">
          {favorites.map((favorite) => (
            <div className="product" key={favorite._id}>
              <button
                className="favorite-icon"
                onClick={() => removeFromFavorites(favorite._id)}
              >
                ❤️
              </button>
              <Link to={`/product/${favorite._id}`}>
                <img
                  src={`http://localhost:4000/uploads/${favorite.file_name}`}
                  alt={favorite.name}
                  className="favorite-image"
                />
                <p className="favorite-name">{favorite.name}</p>
                <p className="favorite-description">{favorite.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};
