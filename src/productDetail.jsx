import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './productDetail.css';

export const ProductDetail = () => {
  const { id } = useParams();
  const { accessToken, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [availableAttributes, setAvailableAttributes] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:4000/products/${id}`);
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);

          setAvailableAttributes(productData.attributes || []);
          setSelectedAttribute(productData.attributes[0] || null);
        } else {
          console.error('Error fetching product:', response.status);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    }

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    setShowDialog(true);
  };

  const handleConfirmAddToCart = async () => {
    if (selectedAttribute === null) {
      alert('Please select an attribute.');
      return;
    }
  
    const userId = user._id;
    const productId = id;
    const attribute=selectedAttribute
  
    try {
      console.log('Request Body:', JSON.stringify({
        productId: productId,
        quantity: quantity,
        attribute: attribute,
      }));
      
      const response = await fetch('http://localhost:4000/add-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
          attribute: selectedAttribute, // Include selectedAttribute
        }),
      });
  
      if (response.ok) {
        setShowDialog(false);
      } else {
        console.error('Error adding item to the cart:', response.status);
      }
    } catch (error) {
      console.error('Error adding item to the cart:', error);
    }
  };
  
  return (
    <div>
      <Navbar />
      <div className="product-details-container">
        {product ? (
          <div className="product-details-content">
            <div className="product-image">
              <img
                src={`http://localhost:4000/uploads/${product.file_name}`}
                alt={product.name}
              />
            </div>
            <div className="product-info">
              <h1 className="product-name">{product.name}</h1>
              <p className="product-price">${product.price.toFixed(2)}</p>
              <p className="product-description">{product.description}</p>
              <div className="product-attributes">
                <p>Attributes:</p>
                <select
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                >
                  {availableAttributes.map((attribute) => (
                    <option key={attribute} value={attribute}>
                      {attribute}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddToCart}>Add to Cart</button>
            </div>
            <div className="product-reviews">
              {/* Add review section here */}
            </div>
          </div>
        ) : (
          <p>Loading product details...</p>
        )}
      </div>

      {showDialog && (
        <div className="cart-dialog">
          <h2>Add to Cart</h2>
          <p>Quantity:</p>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button onClick={() => setShowDialog(false)}>Cancel</button>
          <button onClick={() => handleConfirmAddToCart()}>Add to Cart</button>
        </div>
      )}

      <Footer />
    </div>
  );
};
