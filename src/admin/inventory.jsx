import React, { useState, useEffect } from 'react';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import { useAuth } from '../auth';
import './inventory.css'; // Create a CSS file for your styling

export const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const { user } = useAuth(); 
  console.log(user)
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/products'); 
      if (response.ok) {
        const productsData = await response.json();

        setProducts(productsData.filter((product) => product.available));
      } else {
        console.error('Failed to fetch products:', response.status);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleUpdateInventory = (product) => {
    setSelectedProduct(product);
    console.log(product)
    setShowUpdateDialog(true);
  };

  const handleAddQuantity = async () => {

    if (selectedProduct) {
      
      try {
        const response = await fetch(`http://localhost:4000/updateQuantity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
           productId:selectedProduct._id,
           quantity:parseInt(newQuantity)
          }),
        });

        if (response.ok) {
          const updatedProduct = await response.json();
          fetchProducts();
        } else {
          console.error('Failed to update product quantity:', response.status);
        }
      } catch (error) {
        console.error('Error updating product quantity:', error);
      }
    }

    setShowUpdateDialog(false);
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
      <div className="inventory-container">
        <h1>Inventory Management</h1>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td>
                  <button onClick={() => handleUpdateInventory(product)}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminFooter />

      {showUpdateDialog && selectedProduct && (
        <div className="update-dialog">
          <h2>Update Quantity</h2>
          <p>Product: {selectedProduct.name}</p>
          <label>
            Quantity:
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
          </label>
          <button className="add-button" onClick={handleAddQuantity}>
            Add
          </button>
          <button
            className="cancel-button"
            onClick={() => setShowUpdateDialog(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
