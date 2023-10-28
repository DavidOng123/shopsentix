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
  const isAdmin = user?.role === 'admin';

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await axios.get('http://localhost:4000/all-orders');
        console.log('Response Data:', response.data);

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

  return (
    <div>
      <AdminHeader />
      <div className="order-management-container">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <p className="order-id">Order ID: {order._id}</p>
              <p className="order-status">Current Status: {order.status}</p>
            </div>
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
            <div className="order-action">
              <label htmlFor={`status-select-${order._id}`}>Change Status:</label>
              <select
                id={`status-select-${order._id}`}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                value={order.status}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      <AdminFooter />
    </div>
  );
};
