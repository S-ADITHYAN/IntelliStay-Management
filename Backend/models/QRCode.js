const mongoose = require('mongoose');

const QRCodeSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  data: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['checkin', 'checkout'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic deletion of expired QR codes
QRCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QRCode', QRCodeSchema); 