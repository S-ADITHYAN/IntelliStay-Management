import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHistory, FaUtensils, FaClock, FaMoneyBill, 
  FaMotorcycle, 
  FaTable, 
  FaShoppingBag, 
  FaConciergeBell  } from 'react-icons/fa';
import './OrderHistory.css';
import Loader from '../shared/Loader';
import Header from '../../components/Header';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import Footer from '../../components/footer';


const formatDate = (dateString) => {
  const date = new Date(dateString);
  
  // Get day, month, and year
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
  const year = date.getFullYear();
  
  // Get time
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert hours to 12-hour format
  const hours12 = (hours % 12) || 12;

  // Return formatted date and time
  return `${day}-${month}-${year} at ${hours12}:${minutes} ${ampm}`;
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const decoded = jwtDecode(token);
      return decoded._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = getUserIdFromToken();
      const response = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/my-orders/${userId}`);
      setOrders(Array.isArray(response.data.data) ? response.data.data : []);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffd700',
      'confirmed': '#1e90ff',
      'preparing': '#ff8c00',
      'ready': '#32cd32',
      'delivered': '#008000',
      'cancelled': '#ff0000'
    };
    return colors[status] || '#808080';
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  }) : [];

  const getOrderTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'dine-in':
        return <FaTable className="order-type-icon dine-in" />;
      case 'takeaway':
        return <FaShoppingBag className="order-type-icon takeaway" />;
      case 'delivery':
        return <FaMotorcycle className="order-type-icon delivery" />;
      default:
        return <FaConciergeBell className="order-type-icon" />;
    }
  };

  const getOrderTypeLabel = (type) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };



  const handleCancelOrder = async (orderId) => {
    try {
      // First warning about non-refundable cancellation
      const warningResult = await Swal.fire({
        title: 'Non-Refundable Cancellation',
        html: `
          <div class="cancellation-warning">
            <p>Please note:</p>
            <ul>
              <li>Order cancellation is non-refundable</li>
              <li>Payment amount will not be returned</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Proceed with Cancellation',
        cancelButtonText: 'Keep Order',
        reverseButtons: true
      });

      // If user confirms they understand it's non-refundable
      if (warningResult.isConfirmed) {
        // Second confirmation for cancellation
        const confirmResult = await Swal.fire({
          title: 'Confirm Cancellation',
          text: 'Are you sure you want to cancel this order?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, Cancel Order',
          cancelButtonText: 'No, Keep Order',
          reverseButtons: true
        });

        if (confirmResult.isConfirmed) {
          // Show loading state
          Swal.fire({
            title: 'Cancelling Order',
            text: 'Please wait...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Make API call to cancel order
          const userId = getUserIdFromToken();
          const response = await axios.put(
            `${import.meta.env.VITE_API}/user/restaurant/orders/cancel/${orderId}`,
            {userId},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            // Show success message
            await Swal.fire({
              title: 'Order Cancelled',
              text: 'Your order has been successfully cancelled',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            // Refresh orders list
            fetchOrders();
          } else {
            throw new Error(response.data.message || 'Failed to cancel order');
          }
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Show error message
      await Swal.fire({
        title: 'Cancellation Failed',
        text: error.response?.data?.message || 'Failed to cancel order. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
    <div className='menunav'>
      <Header title="Guest Information" subtitle="Fill in guest details" />
    </div>
    <div className="order-history-container">
      <h2><FaHistory /> Order History</h2>

      <div className="filter-buttons">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">No orders found</div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-6)}</span>
                <span 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-item items-section">
                  <div className="section-header">
                    <FaUtensils />
                    <span>Order Items:</span>
                  </div>
                  <div className="items-grid">
                    {order.items.map(item => (
                      <div key={item._id} className="order-item">
                        <div className="item-image-container">
                          <img 
                            src={item.menuItem.image} 
                            alt={item.menuItem.name}
                            className="item-image"
                            onError={(e) => {
                              e.target.src = '/default-food-image.png'; // Fallback image
                              e.target.onerror = null; // Prevent infinite loop
                            }}
                            loading="lazy" // Added for better performance
                          />
                        </div>
                        <div className="item-info">
                          <span className="item-name">{item.menuItem.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-item">
                  <FaClock />
                  <span>Order Date:</span>
                  {formatDate(order.orderDate)}
                </div>
                
                <div className="detail-item order-type">
              {getOrderTypeIcon(order.orderType)}
              <span>Order Type:</span>
              <span className={`type-label ${order.orderType?.toLowerCase()}`}>
                {getOrderTypeLabel(order.orderType)}
              </span>
            </div>

                <div className="detail-item">
                  <FaMoneyBill />
                  <span>Total Amount:</span>
                  ₹{order.totalAmount.toFixed(2)}
                </div>
              </div>

              {order.status === 'pending' && (
                <button 
                  className="cancel-btn"
                  onClick={() => handleCancelOrder(order._id)}
                >
                  Cancel Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    <div className='footer'>
      <Footer/>
    </div>
    </>
  );
};

export default OrderHistory; 