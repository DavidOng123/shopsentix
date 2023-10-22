import React, { useState, useEffect,useRef } from 'react';
import { Link } from 'react-router-dom';
import './adminDashboard.css';
import AdminHeader from './adminHeader'; 
import { useAuth } from '../auth';
import AdminFooter from './adminFooter';
import Chart from 'chart.js/auto';

export const AdminDashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sentimentData, setSentimentData] = useState([]);
  
  const [productSalesData, setProductSalesData] = useState([]);
  const { user } = useAuth(); 


  console.log(user)
  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    fetch('http://localhost:4000/orders')
      .then((response) => response.json())
      .then((data) => {
        // Assuming the API response has a structure like { totalSales: 10000, totalOrders: 100 }
        setTotalSales(data.totalSales);
        setTotalOrders(data.totalOrders);
      })
      .catch((error) => {
        console.error('Failed to fetch total sales and orders:', error);
      });

      fetch('http://localhost:4000/productSales')
      .then((response) => response.json())
      .then((data) => {
        setProductSalesData(data);
        console.log("Product sales:"+data)
      })
      .catch((error) => {
        console.error('Failed to fetch product sales data:', error);
      });
  }, []);

  const chartRef = useRef(null);

  useEffect(() => {
    if (productSalesData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = document.getElementById('productSalesChart').getContext('2d');

    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: productSalesData.map((item) => item.productName),
        datasets: [
          {
            label: 'Quantity Sold',
            data: productSalesData.map((item) => item.quantitySold),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity Sold',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Product Name',
            },
          },
        },
      },
    });

    chartRef.current = newChart;
  }, [productSalesData]);


  // if (!isAdmin) {
  //   return (
  //     <div>
  //       <AdminHeader />
  //       <div className="admin-dashboard-container">
  //         <p>You don't have access to this page.</p>
  //       </div>
  //       <AdminFooter />
  //     </div>
  //   );
  // }   
  return (
    <div>
<AdminHeader/>
    
    <div className="admin-dashboard-container">
      
      <header>
        <h1>Admin Dashboard</h1>
      </header>
      <section className="dashboard-stats">
        <div className="stat-box">
          <h2>Total Sales</h2>
          <p>${totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h2>Total Orders</h2>
          <p>{totalOrders}</p>
        </div>
        <div className="stat-box">
          <h2>Total Customers</h2>
          <p>500</p>
        </div>
      </section>
      <section className="sentiment-analysis">
        <h2>Sentiment Analysis</h2>
        {sentimentData.length === 0 ? (
          <p>Loading sentiment analysis data...</p>
        ) : (
          <ul>
            {sentimentData.map((item, index) => (
              <li key={index}>
                <strong>Product: {item.productName}</strong>
                <p>Sentiment: {item.sentiment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="sentiment-analysis">
      <h2>Sales Report</h2>
        <canvas id="productSalesChart"></canvas>
      </div>

      
    </div>

    <AdminFooter/>
    </div>
  );
};
