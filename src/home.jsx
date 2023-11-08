import { Navbar } from './navbar';
import { Footer } from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from './auth';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './main.css';
import './product.css';
import { ElfsightWidget } from 'react-elfsight-widget';

export const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshAccessToken, login } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [mostPopularProducts, setMostPopularProducts] = useState([]);
  const [carouselData, setCarouselData] = useState([]);

 

  useEffect(() => {
  
    const checkAndRefreshToken = async () => {
      const currentTime = Date.now() / 1000;
      const tokenExpiration = localStorage.getItem('tokenExpiration');

      if (tokenExpiration && currentTime > tokenExpiration) {
        try {
          await refreshAccessToken();
          setTokenRefreshed(true);
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    };

    checkAndRefreshToken();
    const tokenCheckInterval = 15 * 60 * 1000; 
    const tokenCheckIntervalId = setInterval(checkAndRefreshToken, tokenCheckInterval);
  return () => {
        clearInterval(tokenCheckIntervalId);
      };
    
 
  }, [isAuthenticated, navigate, refreshAccessToken]);

  useEffect(() => {
    fetchCarouselData(); 
    fetchProducts();
    fetchTopRatedProducts();
    fetchSuggestedProducts();
    fetchMostPopularProducts();
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'Password should be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      try {
        await login(formData.email, formData.password);

        console.log('Logged in');
        navigate('/profile', { replace: true });
      } catch (error) {
        console.error(error);
      }

      // Clear form data and errors
      setFormData({
        email: '',
        password: '',
      });

      setErrors({
        email: '',
        password: '',
      });
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const fetchCarouselData = async () => {
    try {
      const response = await fetch('http://localhost:4000/getCarousel');
      const data = await response.json();
      setCarouselData(data);
    } catch (error) {
      console.error('Error fetching carousel data:', error);
    }
  };


  const fetchTopRatedProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/top-rated-product'); 
      const data = await response.json();
      setTopRatedProducts(data);
    } catch (error) {
      console.error('Error fetching top-rated products:', error);
    }
  };

  const fetchSuggestedProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/suggested-product'); 
      const data = await response.json();
      setSuggestedProducts(data);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
    }
  };

  const fetchMostPopularProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/most-popular-product');
      const data = await response.json();
      setMostPopularProducts(data);
    } catch (error) {
      console.error('Error fetching most popular products:', error);
    }
  };


  const handleCategoryClick = (category) => {
    setSelectedCategory(category);

    if (category === 'all') {
      const filtered = products.slice(0, 3); // Limit to 3 products
      setFilteredProducts(filtered);
    } else {
      const filtered = products.filter((product) => product.category === category).slice(0, 3);
      setFilteredProducts(filtered);
    }
  };

  const fetchProducts = async (category) => {
    try {
      const response = await fetch(`http://localhost:4000/products`);
      const product = await response.json();
      

      const data = product.filter((product) => product.available === true).slice(0, 3).map((product) => ({
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
        <header className="main-header">
              <h1>Promotions</h1>
            </header>
          <div className="carousel-container">
          <Carousel autoPlay infiniteLoop showStatus={false} showThumbs={false} interval={5000}>
              {carouselData.map((carouselItem) => (
                <div key={carouselItem._id} >
                  <img src={carouselItem.imageUrl} alt={carouselItem.caption} />
                  <p>{carouselItem.caption}</p>
                </div>
              ))}
            </Carousel>
          </div>
         
           <div className="popular-product">
            <header className="main-header">
              <h1>Popular Products</h1>
            </header>
            <div className="popular-category">
            <Link to={`/product/${topRatedProducts._id}`}>
                <div className="product" >
                <div className="product-label">Top Rated</div>
                  <img src={ `http://localhost:4000/uploads/${topRatedProducts.file_name}`} alt={topRatedProducts.name} />
                  <h2>{topRatedProducts.name}</h2>
                  <p>Price: ${topRatedProducts.price}</p>
                </div>
                </Link>

                <Link to={`/product/${suggestedProducts._id}`}>
                <div className="product">
                <div className="product-label">Suggested</div>
                  <img src={`http://localhost:4000/uploads/${suggestedProducts.file_name}`} alt={suggestedProducts.name} />
                  <h2>{suggestedProducts.name}</h2>
                  <p>Price: ${suggestedProducts.price}</p>
                </div>
                </Link>

                <Link to={`/product/${mostPopularProducts._id}`}>
                <div className="product">
                <div className="product-label">Most Popular</div>
                  <img src={`http://localhost:4000/uploads/${mostPopularProducts.file_name}`} alt={mostPopularProducts.name} />
                  <h2>{mostPopularProducts.name}</h2>
                  <p>Price: ${mostPopularProducts.price}</p>
                </div>
                </Link>
            </div>
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
              className={`category-button ${selectedCategory === 'smartphone' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Smartphone')}
            >
              Smartphone
            </button>
            <button
              className={`category-button ${selectedCategory === 'tablet' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Tablet')}
            >
              Tablet
            </button>
            <button
              className={`category-button ${selectedCategory === 'laptop' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Laptop')}
            >
              Laptop
            </button>
            <button
              className={`category-button ${selectedCategory === 'television' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Television')}
            >
              Tablet
            </button>
            <button
              className={`category-button ${selectedCategory === 'wearable' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('Wearable')}
            >
              Laptop
            </button>
          </div>
          
          <div className="popular-category">
         
  {filteredProducts.map((product) => (
    <div className="product" key={product._id}>
      {product.quantity === 0 ? ( 
        <div>
          <div className="product-image">
            <img src={product.imageUrl} alt={product.name} />
          </div>
          <div className="product-details">
            <h2>{product.name}</h2>
            <p>Price: ${product.price}</p>
            <p className="out-of-stock-message">Out of Stock</p>
          </div>
        </div>
      ) : (
        <Link to={`/product/${product._id}`}>
          <div className="product-image">
            <img src={product.imageUrl} alt={product.name} />
          </div>
          <div className="product-details">
            <h2>{product.name}</h2>
            <p>Price: ${product.price}</p>
          </div>
        </Link>
      )}
    </div>
  ))}
</div>
<Link to='/product' className="explore-link">
                    Explore more
                  </Link>
                  <br></br>
                  <br></br>


{isAuthenticated ? null : (
  
              <div className='loginbox'>
                <hr></hr>
                <br></br>
                <br></br>
              <div className='title'>LOGIN</div>
              <form onSubmit={handleLogin}>
                <div className='form-group'>
                  <label htmlFor='email'>Email</label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className='error'>{errors.email}</div>
                </div>

                <div className='form-group'>
                  <label htmlFor='password'>Password</label>
                  <input
                    type='password'
                    id='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className='error'>{errors.password}</div>
                </div>

                <button type='submit'>Login</button>
              </form>
              <p>
                Don't have an account?{' '}
                <Link to='/register' style={{ color: 'blue', textDecoration: 'underline' }}>
                  Register
                </Link>
                <p>
<Link to='/resetpassword' style={{ color: 'blue', textDecoration: 'underline' }}>
  Forgot Password?
</Link>
</p>
              </p>
              <br></br>
                <br></br>
                <hr></hr>
            </div>
          )}
        </div>
        
      <ElfsightWidget widgetID="3c6c8ed5-7405-464c-8b70-b437d9c575b4" />
      </div>
      <Footer />
    </div>
  );
};
