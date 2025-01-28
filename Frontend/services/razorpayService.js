import axios from 'axios';

export const razorpayService = {
  async createOrder(orderData) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/restaurant/create-razorpay-order`, {
        amount: orderData.totalAmount,
        currency: 'INR',
        orderId: orderData._id
      });
      return response.data;
    } catch (error) {
      throw new Error('Error creating Razorpay order');
    }
  },

  async verifyPayment(paymentData) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/restaurant/verify-payment`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error('Payment verification failed');
    }
  },

  loadRazorpay() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}; 