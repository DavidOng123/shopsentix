    import { Navbar } from './navbar';
    import { Footer } from './Footer';
    import { Link, useNavigate } from 'react-router-dom';
    import React, { useState, useEffect } from 'react';
    import 'react-responsive-carousel/lib/styles/carousel.min.css';
    import './main.css';
    import './product-page.css';

    export const Product = () => {
        const [products, setProducts] = useState([]);
        const [filteredProducts, setFilteredProducts] = useState([]);
        const [categoryFilter, setCategoryFilter] = useState('all');
        const [sortOption, setSortOption] = useState('priceAsc');
        const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

        useEffect(() => {
            async function fetchProducts() {
                try {
                    const response = await fetch('http://localhost:4000/products');
                    if (response.ok) {
                        const product = await response.json();

                        const data = product.map((product) => ({
                            ...product,
                            imageUrl: `http://localhost:4000/uploads/${product.file_name}`,
                        }));
                        setProducts(data);
                        setFilteredProducts(data);
                    } else {
                        console.error('Error fetching products:', response.status);
                    }
                } catch (error) {
                    console.error('Error fetching products:', error);
                }
            }

            fetchProducts();
        }, []);

        useEffect(() => {
            const filtered = products
              .filter((product) => product.available)
              .filter((product) => {
                return categoryFilter === 'all' || product.category === categoryFilter;
              })
              .filter((product) => {
                return !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
              });
        
            const sorted = filtered.sort((a, b) => {
              if (sortOption === 'priceAsc') {
                return a.price - b.price;
              } else if (sortOption === 'priceDesc') {
                return b.price - a.price;
              }
            });
        
            setFilteredProducts(sorted);
          }, [categoryFilter, sortOption, products, searchQuery]);

        return (
            <div>
                <Navbar />
                <div className='product-wrapper'>
                <div className='search-input-container'>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
                    <div className='select-controls'>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="Smartphone">Smartphone</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Television">Television</option>
                            <option value="Wearable">Wearable</option>
                        </select>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                        </select>
                    </div>

                    
        
        <div className='product-list'>
          {searchQuery ? (
            filteredProducts.length === 0 ? (
              <p>No results found for '{searchQuery}'</p>
            ) : (
              filteredProducts.map((product) => (
                <div className="product" key={product._id}>
                  {product.quantity === 0 ? (
                    <div>
                      <div className="product-image">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                      <div className="product-details">
                        <h2>{product.name}</h2>
                        <p>Price: ${product.price}</p>
                        <p>Out of Stock</p>
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
              ))
            )
          ) : (
            filteredProducts.map((product) => (
              <div className="product" key={product._id}>
                {product.quantity === 0 ? (
                  <div>
                    <div className="product-image">
                      <img src={product.imageUrl} alt={product.name} />
                    </div>
                    <div className="product-details">
                      <h2>{product.name}</h2>
                      <p>Price: ${product.price}</p>
                      <p>Out of Stock</p>
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
            ))
          )}
        </div>
                </div>
                <Footer />
            </div>
        );
    };
