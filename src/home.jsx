import { Navbar } from './navbar';
import { Footer } from './Footer';
import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './main.css';
import './product.css';
import axios from 'axios';

export const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const serverBaseUrl = `http://localhost:4000`;

  const handleCategoryClick = (category) => {
    // Update the selected category state when a button is clicked
    setSelectedCategory(category);

    // Filter products based on the selected category
    if (category === 'all') {
      // If "All" is selected, show all products
      setFilteredProducts(products);
    } else {
      // Filter products by category
      const filtered = products.filter((product) => product.category === category);
      setFilteredProducts(filtered);
    }
  };

  useEffect(() => {
    // Fetch products based on the selected category
    fetchProducts();

  }, []);

  const fetchProducts = async (category) => {
    try {
      // Make an API request to fetch products based on the selected category
      const response = await fetch(`http://localhost:4000/products`);
      const product = await response.json();
      

      // Update the products state with the fetched data
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
              </div>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
