import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './productManagement.css';
import { Link } from 'react-router-dom'; 
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import { useAuth } from '../auth';

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    attributes: [], 
    image: null,
    quantity: '', 
  });
  const [categories, setCategories] = useState(['Clothing', 'Electronic', 'Accessories']);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth(); 
  console.log(user)
  const isAdmin = user?.role === 'Admin';

  const deleteProduct = async (productId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this product?');

    if (shouldDelete) {
      try {
        const response = await axios.delete(`http://localhost:4000/products/${productId}`);

        if (response.status === 200) {
          const updatedProducts = products.filter((product) => product._id !== productId);
          setProducts(updatedProducts);
          setSuccessMessage('Product deleted successfully.');
          setErrorMessage('');
        } else {
          setErrorMessage('Failed to delete product.');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setErrorMessage('Failed to delete product.');
      }
    }
  };

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
      formData.append('category', newProduct.category);
      formData.append('attributes', JSON.stringify(newProduct.attributes)); 
      formData.append('image', newProduct.image);
      formData.append('quantity', newProduct.quantity); 

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
          category: '',
          attributes: [],
          image: null,
          quantity: '', 
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
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/products');
        if (response.status === 200) {
          const productsData = response.data;
          setProducts(productsData.filter((product) => product.available));
        } else {
          console.error('Failed to fetch products:', response.status);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

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
      <div className="product-management-container">
        <header>
          <h1>Product Management</h1>
        </header>
        <section className="product-list">
  <h2>Product List</h2>
  </section>
  <div className="product-list-row">
    {products.map((product, index) => (
      <div className="product-tile" key={index}>
        <strong>{product.name}</strong>
        <p>Price: ${product.price}</p>
        <p>Description: {product.description}</p>
        <p>Category: {product.category}</p>
        <p>Attributes: {Array.isArray(product.attributes) ? product.attributes.join(', ') : ''}</p>
        <p>Quantity: {product.quantity}</p>
        <button><Link to={`/admin/editProduct/${product._id}`}>Edit</Link> </button>
        <button onClick={() => deleteProduct(product._id)}>Delete</button>
      </div>
    ))}
  </div>

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
              <input
                type="text"
                placeholder="Custom Attributes (Comma Separated)"
                value={newProduct.attributes}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    attributes: e.target.value.split(',').map((attr) => attr.trim()),
                  })
                }
              />
            </div>
            <div className="attribute-section">
              <input
                type="number"
                placeholder="Quantity"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
              />
            </div>
            <label className="file-input-wrapper">
              <span className="file-input-label">
                {newProduct.image ? newProduct.image.name : 'Choose an image file'}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} />
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
