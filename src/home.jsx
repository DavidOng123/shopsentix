import { Navbar } from './navbar';
import { Footer } from './Footer';
import React,{ useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./main.css";
import "./product.css"; 

export const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Define a function to handle category button clicks
  const handleCategoryClick = (category) => {
    // Update the selected category state when a button is clicked
    setSelectedCategory(category);
  };
  return (
    <div className='wrapper'>
      <Navbar />
      
      <div className='content-container'>
        <div className='content'>
        <div className="carousel-container">
      <Carousel autoPlay infiniteLoop showStatus={false} showThumbs={false} interval={5000}>
        <div>
          <img src="https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/448447/item/goods_01_448447.jpg?width=494" alt="Promotion 1" />
          <p className="legend">Promotion 1</p>
        </div>
        <div>
          <img src="https://cf.shopee.com.my/file/0fea13b46e2ed520ee784b547ec43a3d" alt="Promotion 2" />
          <p className="legend">Promotion 2</p>
        </div>
        <div>
          <img src="https://image.uniqlo.com/UQ/ST3/my/imagesgoods/446935/item/mygoods_24_446935.jpg?width=494" alt="Promotion 3" />
          <p className="legend">Promotion 3</p>
        </div>
      </Carousel>
    </div>
        <header className="main-header">
            <h1>Discover Amazing Products</h1>
            <p>Shop the latest trends with confidence</p>
          </header>
          <div className="category-bar">
            <button
              className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
              data-category="all"
              onClick={() => handleCategoryClick('all')}
            >
              All
            </button>
            <button
              className={`category-button ${selectedCategory === 'clothing' ? 'active' : ''}`}
              data-category="clothing"
              onClick={() => handleCategoryClick('clothing')}
            >
              Clothing
            </button>
            <button
              className={`category-button ${selectedCategory === 'electronics' ? 'active' : ''}`}
              data-category="electronics"
              onClick={() => handleCategoryClick('electronics')}
            >
              Electronics
            </button>
            <button
              className={`category-button ${selectedCategory === 'accessories' ? 'active' : ''}`}
              data-category="accessories"
              onClick={() => handleCategoryClick('accessories')}
            >
              Accessories
            </button>
          </div>
          <section className="products">
            <div className="product">
              <img src="https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/448447/item/goods_01_448447.jpg?width=494" alt="Product 1" />
              <div className="product-details">
                <h2>Product Name 1</h2>
                <p>Price: $99.99</p>
                <button>Add to Cart</button>
              </div>
            </div>
            <div className="product">
              <img src="https://cf.shopee.com.my/file/0fea13b46e2ed520ee784b547ec43a3d" alt="Product 2" />
              <div className="product-details">
                <h2>Product Name 2</h2>
                <p>Price: $79.99</p>
                <button>Add to Cart</button>
              </div>
            </div>
            <div className="product">
              <img src="https://image.uniqlo.com/UQ/ST3/my/imagesgoods/446935/item/mygoods_24_446935.jpg?width=494" alt="Product 3" />
              <div className="product-details">
                <h2>Product Name 3</h2>
                <p>Price: $129.99</p>
                <button>Add to Cart</button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
  
  
}


