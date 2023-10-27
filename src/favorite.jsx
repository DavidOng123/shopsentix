import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import './favorite.css';

export const Favorite = () => {
  const { user, accessToken } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Fetch user's favorite products from the server
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

  return (
    <div>
        <Navbar />
    <div className="favorite-page">
      
      <h1 className="favorite-title">My Favorites</h1>
      <div className="favorite-grid">
        {favorites.map((favorite) => (
          <Link to={`/product/${favorite._id}`} key={favorite._id}>
            <div className="favorite-item">
              <img
                src={`http://localhost:4000/uploads/${favorite.file_name}`}
                alt={favorite.name}
                className="favorite-image"
              />
              <p className="favorite-name">{favorite.name}</p>
              <p className="favorite-description">{favorite.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
    </div>
    <Footer />
    </div>
  );
};
