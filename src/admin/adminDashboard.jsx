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
  const [uniqueProductNames, setUniqueProductNames] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(''); 
  const { user } = useAuth(); 
  const [selectedInterval, setSelectedInterval] = useState('yearly');


  console.log(user)
  const isAdmin = user?.role === 'Admin';
  useEffect(() => {
    fetch('http://localhost:4000/orders')
      .then((response) => response.json())
      .then((data) => {
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

      fetch('http://localhost:4000/uniqueProductNames')
      .then((response) => response.json())
      .then((data) => {
        setUniqueProductNames(data);
      })
      .catch((error) => {
        console.error('Failed to fetch unique product names:', error);
      });
  }, []);


  
  const chartRef = useRef(null);

const handleProductChange = async (event) => {
  const name = event.target.value;

  try {
    const response = await fetch(`http://localhost:4000/getProductIdByName/${name}`);
    const data = await response.json();

    const productId = data.productId;
    console.log("Product ID by Name: " + productId);

    const reviewsResponse = await fetch(`http://localhost:4000/reviews/${productId}`);
    const reviewsData = await reviewsResponse.json();

    const commentsArray = reviewsData.map((review) => review.comment);
    console.log("Comments Array: ", commentsArray);

    const requestBody = {
      reviews: commentsArray,
    };

    try {
      const sentimentResponse = await fetch('http://127.0.0.1:5000/predict_sentiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();

        // Clear the previous chart
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        const labels = ['Positive', 'Negative', 'Neutral'];
        const backgroundColors = ['green', 'red', 'gray'];
        const dataValues = [sentimentData.positive, sentimentData.negative, sentimentData.neutral];

        const ctx = document.getElementById('sentimentPieChart').getContext('2d');

        const pieChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data: dataValues,
                backgroundColor: backgroundColors,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
          },
        });
        chartRef.current = pieChart;
      } else {
        console.error('Failed to call sentiment analysis API:', sentimentResponse.status);
      }
    } catch (error) {
      console.error('Failed to call sentiment analysis API:', error);
    }
  } catch (error) {
    console.error('Failed to fetch product ID or reviews:', error);
  }
};

  

  useEffect(() => {
    fetchProductSalesData(selectedInterval);
  }, [selectedInterval]);

  const fetchProductSalesData = (interval) => {
    fetch(`http://localhost:4000/product${interval.charAt(0).toUpperCase() + interval.slice(1)}Sales`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        setProductSalesData(data);
      })
      .catch((error) => {
        console.error(`Failed to fetch ${interval} product sales data:`, error);
      });
  };
  
  const handleIntervalChange = (event) => {
    console.log(event.target.value)
    setSelectedInterval(event.target.value);
  };

  const chartRef2 = useRef(null);

  useEffect(() => {
    if (productSalesData.length === 0) return;

    if (chartRef2.current) {
      chartRef2.current.destroy();
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

    chartRef2.current = newChart;
  }, [productSalesData]);

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
      </section>
        <section className="sentiment-analysis">
          <h2>Sentiment Analysis</h2>
          <div>
            <label>Select a Product: </label>
            <select value={selectedProduct} onChange={handleProductChange} className="product-select">
  <option value="">Select a product</option>
  {uniqueProductNames.map((productName) => (
    <option key={productName} value={productName}>
      {productName}
    </option>
  ))}
</select>

          </div>
          <div className="sentiment-analysis">
          <canvas id="sentimentPieChart"></canvas></div>
        </section>
       
      <div className="sentiment-analysis">
      <div className="interval-select">
        <label>Select Interval: </label>
        <select value={selectedInterval} onChange={handleIntervalChange}>
          <option value="yearly">Yearly</option>
          <option value="monthly">Monthly</option>
          <option value="daily">Daily</option>
        </select>
      </div>
      <h2>Sales Report</h2>
        <canvas id="productSalesChart"></canvas>
      </div>

      
    </div>

    <AdminFooter/>
    </div>
  );
};
