import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import { useAuth } from '../auth';
import './editProduct.css';

export const EditProduct = () => {
  
    const { id } = useParams();
    console.log(id)
    const { accessToken, user } = useAuth();
    const [product, setProduct] = useState({});
    const [editable, setEditable] = useState(false);
    const [newProduct, setNewProduct] = useState({}); 
    const [categories, setCategories] = useState(['Clothing', 'Electronic', 'Accessories']);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        const fetchProduct = async () => {
          try {
            const response = await axios.get(`http://localhost:4000/products/${id}`);
            if (response.status === 200) {
              const productData = response.data;
              console.log(productData)
              setProduct(productData);
              setNewProduct(productData); 
            } else {
              console.error('Failed to fetch product:', response.status);
            }
          } catch (error) {
            console.error('Error fetching product:', error);
          }
        };
        fetchProduct();
      }, [id]);


      const handleEditToggle = () => {
        setEditable(!editable);
        if (editable) {
            setShowImageUpload(false);
          }
      };

      const handleSaveChanges = async () => {
        try {
          const response = await axios.post(`http://localhost:4000/products/${id}`, newProduct);
          console.log(newProduct)
    
          if (response.status === 200) {
            setProduct(newProduct); 
            setEditable(false);
            setShowImageUpload(false);
            setSuccessMessage('Product updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
          } else {
            console.error('Failed to update product:', response.status);
          }
        } catch (error) {
          console.error('Error updating product:', error);
        }
      };
  

  if (!isAdmin) {
    return (
      <div>
        <AdminHeader />
        <div className="admin-dashboard-container">
          <p>You don't have access to this page.</p>
        </div>
        <AdminFooter />
      </div>
    );
  }  

  return (
    <div>
      <AdminHeader />
      <div className="edit-product-container">
        <header>
          <h1>Edit Product</h1>
        </header>
        <section className="product-details">
  <h2>Product Details</h2>
  <div className="product-detail-row">
    <div className="product-detail-label">Product Name:</div>
    <input
      type="text"
      value={newProduct.name}
      readOnly={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
    />
  </div>

  <div className="product-detail-row">
    <div className="product-detail-label">Price:</div>
    <input
      type="text"
      value={newProduct.price}
      readOnly={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
    />
  </div>

  <div className="product-detail-row">
    <div className="product-detail-label">Description:</div>
    <input
      type="text"
      value={newProduct.description}
      readOnly={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
    />
  </div>

  <div className="product-detail-row">
    <div className="product-detail-label">Category:</div>
    <select
      value={newProduct.category}
      disabled={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
    >
      <option value="">Select Category</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  </div>

  <div className="product-detail-row">
    <div className="product-detail-label">Custom Attributes:</div>
    <input
      type="text"
      value={newProduct.attributes?.join(', ')}
      readOnly={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, attributes: e.target.value.split(',').map((attr) => attr.trim()) })}
    />
  </div>

  <div className="product-detail-row">
    <div className="product-detail-label">Quantity:</div>
    <input
      type="number"
      value={newProduct.quantity}
      readOnly={!editable}
      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
    />
  </div>

  
          

<div className="product-detail-row">
  {editable ? (
    <button onClick={handleSaveChanges}>Save</button>
  ) : (
    <button onClick={handleEditToggle}>Edit</button>
  )}
</div>
{successMessage && <div className="success-message">{successMessage}</div>}
        </section>
      </div>
      <AdminFooter />
    </div>
  );
};
