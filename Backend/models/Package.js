const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Honeymoon', 'Business', 'Family', 'Weekend', 'Holiday', 'Special'],
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: '₹'
    }
  },
  description: String,
  inclusions: [{
    item: String,
    details: String
  }],
  duration: {
    days: Number,
    nights: Number
  },
  validityPeriod: {
    startDate: Date,
    endDate: Date
  },
  availability: {
    type: Boolean,
    default: true
  },
  maxGuests: Number,
  terms: [String],
  image: String,
  discount: {
    percentage: Number,
    validUntil: Date
  }
});

module.exports = mongoose.model('Package', packageSchema); 