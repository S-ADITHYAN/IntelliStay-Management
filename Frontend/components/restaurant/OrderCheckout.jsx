import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMoneyBill, FaWallet } from 'react-icons/fa';
import axios from 'axios';
// import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import { razorpayService } from '../../services/razorpayService';
import './OrderCheckout.css';
import Header from '../../components/Header';
import Footer from '../../components/footer';
import useAuth from '../../src/useAuth';

// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const OrderCheckout = ({ cart, totalAmount }) => {
  useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const loadRazorpay = async () => {
      const isLoaded = await razorpayService.loadRazorpay();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load');
      }
    };
    loadRazorpay();
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (paymentMethod === 'card') {
        const stripe = await stripePromise;
        const response = await axios.post(`${import.meta.env.VITE_API}/restaurant/create-payment`, {
          amount: totalAmount,
          orderData
        });

        const result = await stripe.confirmCardPayment(response.data.clientSecret, {
          payment_method: {
            card: elements.getElement('card'),
            billing_details: {
              name: 'Customer Name',
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } else if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const { orderId, amount, currency } = await razorpayService.createOrder({
          totalAmount,
          items: cart
        });

        // Configure Razorpay options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: 'Your Restaurant Name',
          description: 'Food Order Payment',
          order_id: orderId,
          handler: async (response) => {
            try {
              // Verify payment
              await razorpayService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              // Handle success
              toast.success('Payment successful!');
              navigate('/restaurant/orders');
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: orderData?.customerName,
            email: orderData?.email,
            contact: orderData?.phone
          },
          theme: {
            color: '#11bad4'
          }
        };

        // Initialize Razorpay
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        await axios.post(`${import.meta.env.VITE_API}/restaurant/place-order`, orderData);
      }

      navigate('/order-confirmation');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className='menunav'>
            <Header title="Guest Information" subtitle="Fill in guest details" />
            </div>
    <div className="checkout-container">
      <h2>Order Checkout</h2>

      <div className="delivery-options">
        <h3>Delivery Options</h3>
        <div className="options-grid">
          <button
            className={`option-btn ${deliveryOption === 'dine-in' ? 'active' : ''}`}
            onClick={() => setDeliveryOption('dine-in')}
          >
            <FaUtensils /> Dine In
          </button>
          <button
            className={`option-btn ${deliveryOption === 'takeaway' ? 'active' : ''}`}
            onClick={() => setDeliveryOption('takeaway')}
          >
            <FaShoppingBag /> Takeaway
          </button>
          <button
            className={`option-btn ${deliveryOption === 'room-service' ? 'active' : ''}`}
            onClick={() => setDeliveryOption('room-service')}
          >
            <FaBed /> Room Service
          </button>
        </div>

        {deliveryOption === 'dine-in' && (
          <div className="form-group">
            <label>Table Number</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
            />
          </div>
        )}

        {deliveryOption === 'room-service' && (
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Enter room number"
            />
          </div>
        )}
      </div>

      <div className="order-summary">
        <h3>Order Summary</h3>
        {cart.map(item => (
          <div key={item._id} className="order-item">
            <span>{item.name} x {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="total">
          <span>Total Amount:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-methods">
        <h3>Payment Method</h3>
        <div className="payment-options">
          <button
            className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <FaCreditCard /> Card Payment
          </button>
          <button
            className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <FaMoneyBill /> Cash Payment
          </button>
          <button
            className={`payment-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('wallet')}
          >
            <FaWallet /> Hotel Wallet
          </button>
          <button
            className={`payment-btn ${paymentMethod === 'razorpay' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('razorpay')}
          >
            <FaWallet /> Razorpay
          </button>
        </div>
      </div>

      <button
        className="checkout-btn"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Confirm Order'}
      </button>
    </div>
    <div className='footer'>
      <Footer/>
    </div>
    </>
  );
};

export default OrderCheckout; 