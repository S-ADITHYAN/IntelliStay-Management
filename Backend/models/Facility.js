const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Pool', 'Gym', 'Spa', 'Business Center', 'Conference Room', 'Parking', 'Other'],
    required: true
  },
  operatingHours: {
    open: String,
    close: String,
    weekendHours: {
      open: String,
      close: String
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Under Maintenance', 'Closed'],
    default: 'Available'
  },
  currentCapacity: {
    current: Number,
    maximum: Number
  },
  description: String,
  amenities: [String],
  pricing: {
    rate: Number,
    unit: String // 'per hour', 'per session', 'free'
  },
  bookingRequired: Boolean,
  image: String
});

module.exports = mongoose.model('Facility', facilitySchema);