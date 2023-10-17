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
    const [sortOption, setSortOption] = useState('priceAsc'); // Default sort option

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
        const filtered = products.filter((product) => {
            return categoryFilter === 'all' || product.category === categoryFilter;
        });

        const sorted = filtered.sort((a, b) => {
            if (sortOption === 'priceAsc') {
                return a.price - b.price;
            } else if (sortOption === 'priceDesc') {
                return b.price - a.price;
            }
        });

        setFilteredProducts(sorted);
    }, [categoryFilter, sortOption, products]);

    return (
        <div>
            <Navbar />
            <div className='product-wrapper'>
                <div className='select-controls'>
                    <select  value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Electronic">Electronics</option>
                        <option value="Accessories">Accessories</option>
                    </select>
                    <select  value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                        <option value="priceAsc">Price: Low to High</option>
                        <option value="priceDesc">Price: High to Low</option>
                    </select>
                </div>

                <div className="product-list">
                    {filteredProducts.map((product) => (
                        <div className="product" key={product._id}>
                            <Link to={`/product/${product._id}`}>
                            <div className="product-image">
                                <img src={product.imageUrl} alt={product.name} />
                            </div>
                            <div className="product-details">
                                <h2>{product.name}</h2>
                                <p>Price: ${product.price}</p>
                            </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};
