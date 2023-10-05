import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './productManagement.css';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '', // Updated category handling
    attributes: [],
    image: null,
  });
  const [categories, setCategories] = useState(['Clothing', 'Electronic','Accessories']);
  const [attributes, setAttributes] = useState(['s', 'm']);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setNewProduct({ ...newProduct, image: selectedImage });
  };

  const addProduct = async () => {
    try {
      const formData = new FormData();

      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description);
      formData.append('category', newProduct.category); // Assign category directly
      formData.append('attributes', JSON.stringify(newProduct.attributes));
      formData.append('image', newProduct.image);

      const response = await axios.post('http://localhost:4000/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setProducts([...products, newProduct]);
        setNewProduct({
          name: '',
          price: '',
          description: '',
          category: '', // Reset category
          attributes: [],
          image: null,
        });
        setSuccessMessage('Product added successfully.');
        setErrorMessage('');
      } else {
        setErrorMessage('Failed to add product.');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setErrorMessage('Failed to add product.');
    }
  };

  useEffect(() => {
    // Fetch your categories here if needed
  }, []);

  return (
    <div>
      <AdminHeader />
      <div className="product-management-container">
        <header>
          <h1>Product Management</h1>
        </header>
        <section className="product-list">
          <h2>Product List</h2>
          <ul>
          {products.map((product, index) => (
  <li key={index}>
    <strong>{product.name}</strong>
    <p>Price: ${product.price}</p>
    <p>Description: {product.description}</p>
    <p>Category: {product.category}</p>
    <p>Attributes: {Array.isArray(product.attributes) ? product.attributes.join(', ') : ''}</p>
    <button>Edit</button>
    <button>Delete</button>
  </li>
))}
          </ul>
        </section>
        <section className="add-product">
          <h2>Add Product</h2>
          <div className="add-product-form">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <div className="attribute-section">
              <select
                value={newProduct.category}
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
            <div className="attribute-section">
              <select
                value={newProduct.attributes}
                onChange={(e) => setNewProduct({ ...newProduct, attributes: e.target.value })}
              >
                <option value="">Select Attribute</option>
                {attributes.map((attribute) => (
                  <option key={attribute} value={attribute}>
                    {attribute}
                  </option>
                ))}
              </select>
            </div>
            <label className="file-input-wrapper">
  <span className="file-input-label">
    {newProduct.image ? newProduct.image.name : 'Choose an image file'}
  </span>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
  />
</label>
            <button onClick={addProduct}>Add Product</button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
          </div>
        </section>
      </div>
      <AdminFooter />
    </div>
  );
};
