import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './Footer';
import { useAuth } from './auth';
import './productDetail.css';


export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const accessToken=localStorage.getItem('accessToken')

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false); // Track if the user has purchased the product
  const [comment, setComment] = useState(''); 
  const [guestCart, setGuestCart] = useState([]);  
  const [numReviewsToShow, setNumReviewsToShow] = useState(3);
  const [showMoreReviews, setShowMoreReviews] = useState(false);
  const [addToFavoritesSuccess, setAddToFavoritesSuccess] = useState(false);


 

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:4000/products/${id}`);
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);

          setAvailableAttributes(productData.attributes || []);
          setSelectedAttribute(productData.attributes[0] || null);

          setAvailableQuantity(
            productData.quantity > 0 ? productData.quantity : 0
          );
        } else {
          console.error('Error fetching product:', response.status);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    }
    

    async function checkIfPurchased() {
      try {
        const response = await fetch(`http://localhost:4000/check-purchase/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          setHasPurchased(true);
        }
      } catch (error) {
        console.error('Error checking purchase:', error);
      }
    }

    fetchProduct();
    fetchReviews();
    checkIfPurchased();
  }, [id, accessToken]);

  async function fetchReviews() {
    try {
      const response = await fetch(`http://localhost:4000/reviews/${id}`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
        setLoadingReviews(false);
      } else {
        console.error('Error fetching reviews:', response.status);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }

  const handleAddToCart = () => {
    setShowDialog(true);
  };

  const handleConfirmAddToCart = async () => {
    if (selectedAttribute === null) {
      alert('Please select an attribute.');
      return;
    }
  
    if (quantity <= 0) {
      alert('Please select a quantity greater than 0.');
      return;
    }
  
    if (quantity > availableQuantity) {
      alert(`Only ${availableQuantity} left in stock.`);
      return;
    }
  
    if (user) {
      const userId = user.id;
      const productId = id;
      const attribute = selectedAttribute;
  
      try {
        const response = await fetch('http://localhost:4000/add-to-cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: productId,
            quantity: quantity,
            attribute: selectedAttribute,
          }),
        });
  
        if (response.ok) {
          setShowDialog(false);
          setHasPurchased(true); 
        } else {
          console.error('Error adding item to the cart:', response.status);
        }
      } catch (error) {
        console.error('Error adding item to the cart:', error);
      }
    } else {
      const existingGuestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };

      const item = {
        product: id,
        quantity: quantity,
        attribute: selectedAttribute,
      };
  
      const existingItemIndex = existingGuestCart.items.findIndex(
        (item) => item.product === id && item.attribute === selectedAttribute
      );
  
      if (existingItemIndex !== -1) {
        existingGuestCart.items[existingItemIndex].quantity += quantity;
      } else {
        existingGuestCart.items.push(item);
      }
  
      localStorage.setItem('guestCart', JSON.stringify(existingGuestCart));
      console.log(existingGuestCart);
      setShowDialog(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (user) {
      try {
        const response = await fetch('http://localhost:4000/add-to-favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: id,
          }),
        });
  
        if (response.ok) {
          console.log('Added to favorites successfully.');
          setAddToFavoritesSuccess(true); 

          setTimeout(() => {
            setAddToFavoritesSuccess(false);
          }, 3000);
        } else {
          console.error('Error adding to favorites:', response.status);
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    }
  };
  
  const handleLoadMoreReviews = () => {
    setNumReviewsToShow(numReviewsToShow + 3);
  };

  const handleShowMoreReviews = () => {
    setShowMoreReviews(true);
  };
  
  return (
    <div className="product-detail-page">
      <Navbar />

      <div className="product-details-container">
  {product ? (
    <div className="product-details-content">
      <div className="product-column product-image-column">
        <img
          src={`http://localhost:4000/uploads/${product.file_name}`}
          alt={product.name}
        />
      </div>
      <div className="product-column product-details-column">
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
        {availableQuantity > 0 && availableQuantity <= 3 && (
          <p className="stock-info">{`Only ${availableQuantity} left in stock.`}</p>
        )}
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          Add to Cart
        </button>
        <button className="add-to-favorites-button" onClick={handleAddToFavorites}>
  Favorite
</button>
      </div>
    </div>
  ) : (
    <p className="loading-message">Loading product details...</p>
  )}
</div>


<div className="product-reviews-container">
        <h3 className="reviews-title">Product Reviews</h3>
        {loadingReviews ? (
          <p className="loading-message">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.slice(0, numReviewsToShow).map((review, index) => (
              <li key={index} className="review-item">
                <span className="review-user">
                  {review.user}:
                </span>
                <span className="review-comment">
                  {review.comment}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-reviews-message">
            Currently, there are no reviews for this product.
          </p>
        )}

        {reviews.length > numReviewsToShow && !showMoreReviews && (
          <div
            className="load-more-reviews"
            onClick={() => handleLoadMoreReviews()}
          >
            Load More Reviews
          </div>
        )}
      </div>



{showDialog && (
      <div className="cart-dialog-overlay">
        <div className="cart-dialog-container">
          <h2 className="cart-title">Add to Cart</h2>
          <p className="quantity-label">Quantity:</p>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button className="cancel-button" onClick={() => setShowDialog(false)}>
            Cancel
          </button>
          <button className="add-to-cart-button" onClick={handleConfirmAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    )}

{addToFavoritesSuccess && (
  <div className="success-message">
    Added to favorites successfully.
  </div>
)}


      <Footer />
    </div>
  );
};
