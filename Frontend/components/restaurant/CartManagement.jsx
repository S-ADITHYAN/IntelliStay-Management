import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaDrumstickBite, FaLeaf } from 'react-icons/fa';
import './CartManagement.css';
import Header from '../../components/Header';
import axios from 'axios';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

const CartManagement = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState({});
  const [showInstructions, setShowInstructions] = useState({});
  const [orderType, setOrderType] = useState('');

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

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API}/user/restaurant/cart/${userId}`
      );
      console.log('API Response:', response.data);
      setCartItems(response.data.data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load cart items'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    console.log('Cart Items:', cartItems);
  }, [cartItems]);

  // Update quantity
  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      if (newQuantity < 1) return;

      await axios.put(
        `${import.meta.env.VITE_API}/user/restaurant/cart/update/${cartItemId}`,
        { quantity: newQuantity }
      );

      fetchCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error updating quantity:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update quantity'
      });
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    console.log('Removing item:', cartItemId);
    try {
      const result = await Swal.fire({
        title: 'Remove Item?',
        text: 'Are you sure you want to remove this item from your cart?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!'
      });

      if (result.isConfirmed) {
        await axios.delete(
          `${import.meta.env.VITE_API}/user/restaurant/cart/remove/${cartItemId}`
        );
        
        Swal.fire('Removed!', 'Item has been removed from cart.', 'success');
        fetchCartItems(); // Refresh cart items
      }
    } catch (error) {
      console.error('Error removing item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to remove item from cart'
      });
    }
  };

  // Calculate totals with null checks
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.subTotal || 0), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Add this function at the top of your component
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Modify your handleCheckout function
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add items to your cart before checking out'
      });
      return;
    }

    if (!orderType) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Order Type',
        text: 'Please select whether you want Dine-in, Takeaway, or Delivery'
      });
      return;
    }

    try {
      // Load Razorpay Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order on backend
      const userId = getUserIdFromToken();
      const response = await axios.post(`${import.meta.env.VITE_API}/user/restaurant/create-order`, {
        amount: calculateTotal() * 100,
        cartItems: cartItems,
        orderType: orderType,
        userId: userId
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: response.data.amount,
        currency: "INR",
        name: "Restaurant Name",
        description: "Food Order Payment",
        order_id: response.data.id,
        handler: async function (response) {
          try {
            const { data } = await axios.post(`${import.meta.env.VITE_API}/user/restaurant/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: userId
            });

            if (data.success) {
              const userid = getUserIdFromToken();
              await axios.post(`${import.meta.env.VITE_API}/user/restaurant/orders`, {
                userid: userid,
                cartItems: cartItems,
                paymentDetails: response,
                totalAmount: calculateTotal(),
                specialInstructions: specialInstructions,
                orderType: orderType
              });

              // await axios.delete(`${import.meta.env.VITE_API}/user/restaurant/clear`);
              setCartItems([]);
              
              Swal.fire({
                icon: 'success',
                title: 'Order Placed Successfully!',
                text: 'Thank you for your order'
              });
              
              navigate('/restaurant/orders');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            Swal.fire({
              icon: 'error',
              title: 'Payment Failed',
              text: 'There was an error processing your payment'
            });
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3399cc"
        },
        notes: {
          orderType: orderType
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Checkout failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: error.message || 'There was an error processing your checkout'
      });
    }
  };

  // Add new function to toggle instructions visibility
  const toggleInstructions = (itemId) => {
    setShowInstructions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <>
      <div className='menunav'>
        <Header title="Shopping Cart" subtitle="Review your items" />
      </div>
      <div className="cart-container">
        <h2><FaShoppingCart /> Your Cart</h2>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/restaurant/menu')} className="view-menu-btn">
              View Menu
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-section">
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item">
                 <div className="item-image">
                  <img src={item.menuItemId.image} alt={item.itemTitle} />
                </div>
                  
                  <div className="item-content">
                    <div className="item-header">
                      <div className="item-title-row">
                        <h3>{item.menuItemId?.name}</h3>
                        <div className="item-badges">
                          <span className={`food-type-badge ${(item.menuItemId?.foodType || 'Veg').toLowerCase()}`}>
                            {item.menuItemId?.foodType === 'Non-Veg' ? (
                              <FaDrumstickBite className="food-icon non-veg-icon" />
                            ) : (
                              <FaLeaf className="food-icon veg-icon" />
                            )}
                          </span>
                          <span className="item-category">{item.menuItemId?.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="item-description">{item.menuItemId?.description}</p>
                    
                    <div className="price-quantity-section">
                      <div className="price-section">
                        <p className="item-price">₹{(item.menuItemId?.price || 0).toFixed(2)}</p>
                        <p className="item-subtotal">
                          Subtotal: ₹{(item.subTotal || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="quantity-section">
                        <label>Quantity:</label>
                        <div className="quantity-controls">
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="quantity-btn"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus />
                          </button>
                          <span className="quantity">{item.quantity || 0}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="quantity-btn"
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button 
                        onClick={() => toggleInstructions(item._id)}
                        className="instructions-toggle-btn"
                      >
                        {showInstructions[item._id] ? 'Hide Instructions' : 'Add Instructions'}
                      </button>

                      {showInstructions[item._id] && (
                        <textarea
                          placeholder="Special instructions..."
                          value={specialInstructions[item._id] || ''}
                          onChange={(e) => setSpecialInstructions(prev => ({
                            ...prev,
                            [item._id]: e.target.value
                          }))}
                          className="special-instructions"
                        />
                      )}

                      <button 
                        onClick={() => removeFromCart(item._id)}
                        className="remove-btn"
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-section">
              <div className="cart-summary">
                <h3>Order Summary</h3>
                
                <div className="order-type-selection">
                  <h4>Select Order Type:</h4>
                  <div className="order-type-buttons">
                    <button 
                      className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                      onClick={() => setOrderType('dine-in')}
                    >
                      <i className="fas fa-utensils"></i>
                      Dine In
                    </button>
                    <button 
                      className={`order-type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
                      onClick={() => setOrderType('takeaway')}
                    >
                      <i className="fas fa-shopping-bag"></i>
                      Takeaway
                    </button>
                    <button 
                      className={`order-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                      onClick={() => setOrderType('delivery')}
                    >
                      <i className="fas fa-motorcycle"></i>
                      Delivery
                    </button>
                  </div>
                </div>

                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Tax (10%):</span>
                  <span>₹{calculateTax().toFixed(2)}</span>
                </div>
                
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="checkout-btn"
                  disabled={!orderType}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartManagement; 