const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const razorpayController = {
  async createOrder(req, res) {
    try {
      const { amount, currency, orderId } = req.body;

      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: orderId,
        payment_capture: 1
      };

      const razorpayOrder = await razorpay.orders.create(options);

      // Save order details
      await Order.findByIdAndUpdate(orderId, {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING'
      });

      res.json({
        orderId: razorpayOrder.id,
        currency: razorpayOrder.currency,
        amount: razorpayOrder.amount
      });
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      res.status(500).json({ error: 'Error creating payment order' });
    }
  },

  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      // Verify signature
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Update order status
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Create payment record
      const payment = await Payment.create({
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: order.totalAmount,
        status: 'SUCCESS'
      });

      // Update order status
      order.paymentStatus = 'PAID';
      order.paymentDetails = {
        paymentId: razorpay_payment_id,
        paymentDate: new Date()
      };
      await order.save();

      res.json({ success: true, payment });
    } catch (error) {
      console.error('Payment Verification Error:', error);
      res.status(500).json({ error: 'Error verifying payment' });
    }
  },

  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const { payload } = req.body;
      const { payment } = payload;

      switch (req.body.event) {
        case 'payment.captured':
          await handlePaymentSuccess(payment.entity);
          break;
        case 'payment.failed':
          await handlePaymentFailure(payment.entity);
          break;
        default:
          console.log(`Unhandled event type ${req.body.event}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
};

async function handlePaymentSuccess(payment) {
  try {
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (order) {
      order.paymentStatus = 'PAID';
      order.paymentDetails = {
        paymentId: payment.id,
        paymentDate: new Date(),
        method: payment.method
      };
      await order.save();
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(payment) {
  try {
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (order) {
      order.paymentStatus = 'FAILED';
      order.paymentDetails = {
        paymentId: payment.id,
        error: payment.error_description
      };
      await order.save();
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

module.exports = razorpayController; 