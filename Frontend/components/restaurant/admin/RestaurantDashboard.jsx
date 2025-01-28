import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUtensils, 
  FaChartLine, 
  FaUsers, 
  FaMoneyBillWave,
  FaCalendarCheck,
  FaExclamationTriangle 
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeReservations: 0,
    popularItems: [],
    recentOrders: [],
    dailyRevenue: []
  });

  const [alerts, setAlerts] = useState([]);
  const [timeFrame, setTimeFrame] = useState('week');

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
  }, [timeFrame]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/restaurant/admin/dashboard`, {
        params: { timeFrame }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/restaurant/admin/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  return (
    <div className="restaurant-dashboard">
      <h2>Restaurant Dashboard</h2>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUtensils />
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <h3>Revenue</h3>
            <p>${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendarCheck />
          </div>
          <div className="stat-info">
            <h3>Active Reservations</h3>
            <p>{stats.activeReservations}</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3><FaExclamationTriangle /> Alerts</h3>
          <div className="alerts-grid">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-card ${alert.type}`}>
                <h4>{alert.title}</h4>
                <p>{alert.message}</p>
                <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="chart-section">
        <h3>Revenue Overview</h3>
        <div className="chart-controls">
          <button 
            className={timeFrame === 'week' ? 'active' : ''} 
            onClick={() => setTimeFrame('week')}
          >
            Week
          </button>
          <button 
            className={timeFrame === 'month' ? 'active' : ''} 
            onClick={() => setTimeFrame('month')}
          >
            Month
          </button>
          <button 
            className={timeFrame === 'year' ? 'active' : ''} 
            onClick={() => setTimeFrame('year')}
          >
            Year
          </button>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#11bad4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items */}
      <div className="popular-items-section">
        <h3>Popular Items</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.popularItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#11bad4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders-section">
        <h3>Recent Orders</h3>
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-6)}</td>
                  <td>{order.customerName}</td>
                  <td>{order.items.length} items</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard; 