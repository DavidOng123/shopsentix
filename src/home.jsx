import { Navbar } from './navbar';
import { Footer } from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from './auth';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './main.css';
import './product.css';

export const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshAccessToken } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [tokenRefreshed, setTokenRefreshed] = useState(false);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);

    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) => product.category === category);
      setFilteredProducts(filtered);
    }
  };

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
    fetchProducts();
  }, [isAuthenticated, navigate, refreshAccessToken]);

  const fetchProducts = async (category) => {
    try {
      const response = await fetch(`http://localhost:4000/products`);
      const product = await response.json();

      const data = product.map((product) => ({
        ...product,
        imageUrl: `http://localhost:4000/uploads/${product.file_name}`,
      }));
      console.log(data)
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className='wrapper'>
      <Navbar />
      <div className='content-container'>
        <div className='content'>
          <div className="carousel-container">
            <Carousel autoPlay infiniteLoop showStatus={false} showThumbs={false} interval={5000}>
              {/* Carousel items */}
            </Carousel>
          </div>
          <header className="main-header">
            <h1>Discover Amazing Products</h1>
            <p>Shop the latest trends with confidence</p>
          </header>
          <div className="category-bar">
            <button
              className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('all')}
            >
              All
            </button>
            <button
              className={`category-button ${selectedCategory === 'clothing' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Clothing')}
            >
              Clothing
            </button>
            <button
              className={`category-button ${selectedCategory === 'electronics' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Electronic')}
            >
              Electronics
            </button>
            <button
              className={`category-button ${selectedCategory === 'accessories' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Accessories')}
            >
              Accessories
            </button>
          </div>
          <section className="products">
            {filteredProducts.map((product) => (
              <div className="product" key={product._id}>
                <Link to={`/product/${product._id}`}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      console.error('Error loading image:', e);
                    }}
                  />
                  <div className="product-details">
                    <h2>{product.name}</h2>
                    <p>Price: ${product.price}</p>
                    <button>Add to Cart</button>
                  </div>
                </Link>
              </div>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
