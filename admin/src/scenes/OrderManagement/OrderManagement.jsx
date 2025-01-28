import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaFilter, 
  FaPrint, 
  FaBell, 
  FaCheck, 
  FaTimes,
  FaUtensils,
  FaClock,
  FaArrowLeft
} from 'react-icons/fa';
import './OrderManagement.css';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme'; // Adjust path as needed

const OrderManagement = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, filterStatus, filterDate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/admin/restaurant/orders`);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId.includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterDate) {
      case 'today':
        filtered = filtered.filter(order => new Date(order.orderDate) >= today);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(order => new Date(order.orderDate) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(order => new Date(order.orderDate) >= monthAgo);
        break;
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API}/admin/restaurant/orders/status/${orderId}`, {
        status: newStatus
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .order-details { margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Order #${order.orderId}</h2>
            <p>Date: ${new Date(order.orderDate).toLocaleString()}</p>
          </div>
          <div class="order-details">
            <p>Customer: ${order.customerName}</p>
            <p>Type: ${order.orderType}</p>
            ${order.tableNumber ? `<p>Table: ${order.tableNumber}</p>` : ''}
          </div>
          <div class="items">
            <h3>Items:</h3>
            ${order.items.map(item => `
              <p>${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</p>
              ${item.specialInstructions ? `<p><i>Note: ${item.specialInstructions}</i></p>` : ''}
            `).join('')}
          </div>
          <div class="total">
            <p>Total: $${order.totalAmount.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  const handleBack = () => {
    navigate(-1); // Goes back to previous page
  };

  return (
    <div className="order-management">
      <div className="page-header">
        <button 
          className="back-btn" 
          onClick={handleBack}
          style={{ color: colors.primary?.[100] || '#000000' }}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="order-header">
        <h2>Order Management</h2>
        <div className="order-controls">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ color: colors.primary?.[300] || '#000000' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ color: colors.primary?.[300] || '#000000' }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order._id} className={`order-card ${order.status}`}>
              <div className="order-header">
                <h3>Order #{order.orderId}</h3>
                <span className={`status-badge ${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-info">
                <p><strong>Order No:</strong> {order._id}</p>
                <p><strong>Customer:</strong> {order.user.displayName}</p>
                <p><strong>Time:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Type:</strong> {order.orderType}</p>
                {order.tableNumber && <p><strong>Table:</strong> {order.tableNumber}</p>}
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-main">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.specialInstructions && (
                      <div className="special-instructions">
                        <i className="instruction-text">Note: {item.specialInstructions}</i>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="order-total">
                <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
              </div>

              <div className="order-actions">
                {order.status === 'pending' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                    className="start-btn"
                  >
                    <FaUtensils /> Start Preparing
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'ready')}
                    className="ready-btn"
                  >
                    <FaCheck /> Mark Ready
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'delivered')}
                    className="deliver-btn"
                  >
                    <FaBell /> Mark Delivered
                  </button>
                )}

                <button 
                  onClick={() => printOrder(order)}
                  className="print-btn"
                >
                  <FaPrint /> Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 && !loading && (
        <div className="no-orders">
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement; 