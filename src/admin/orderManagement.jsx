import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './productManagement.css';
import { Link } from 'react-router-dom';
import AdminHeader from './adminHeader';
import AdminFooter from './adminFooter';
import { useAuth } from '../auth';

import './orderManagement.css'; 

export const OrderManagement = () => {
  const { user } = useAuth();
  console.log(user);
  const isAdmin = user?.role === 'Admin';

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Preparing'); 

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await axios.get(`http://localhost:4000/all-orders`);
        console.log('all Data:', response.data);

       
        setOrders(response.data || []);


      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    }

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:4000/update-orders/${orderId}`, { newStatus });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
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
      <div className="order-management-container">
      <div className="filter-buttons">
          <button
            className={`filter-button ${filterStatus === 'Preparing' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Preparing')}
          >
            Preparing
          </button>
          <button
            className={`filter-button ${filterStatus === 'Processing' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Processing')}
          >
            Processing
          </button>
          <button
            className={`filter-button ${filterStatus === 'Delivered' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Delivered')}
          >
            Delivered
          </button>
          <button
            className={`filter-button ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
        </div>
        {orders.filter((order) => order.status===filterStatus).map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <p className="order-id">Order ID: {order._id}</p>
              <p className="order-status">Current Status: {order.status}</p>
              
            </div>
            <p ><b>Receiver:</b> {order.user.username}</p>
              <p ><b>Shipping Address:</b> {order.shippingAddress}</p>
              
              <p ><b>Contact:</b> {order.user.phoneNumber}</p>
            <div className="order-items">
              {order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="order-item">
                
                  <div className="order-item-details">
                  <hr></hr>
                    <strong>Product: {item.productName}</strong>
                    <p>Quantity: {item.quantity}</p>
                    <p>Attribute: {item.attribute}</p>
                    <hr></hr>
                  </div>
                  
                </div>
              ))}
            </div>
            {order.status !== 'completed' && (
              <div className="order-action">
                <label htmlFor={`status-select-${order._id}`}>Change Status:</label>
                <select
                  id={`status-select-${order._id}`}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  value={order.status}
                >
                  <option value="Preparing">Preparing</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            )}
          </div>
        ))}
          {orders.filter((order) => order.status === filterStatus).length === 0 && (
        <p>No orders matching the selected filter.</p>
      )}
      </div>
      <AdminFooter />
    </div>
  );
};
