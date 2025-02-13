const mongoose = require('mongoose');

const faceAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoogleRegisters',
    required: true,
    unique: true
  },
  faceDescriptor: {
    type: [Number],
    required: true,
    validate: {
      validator: function(array) {
        return array.length === 128; // Face-api.js descriptor length
      },
      message: 'Invalid face descriptor length'
    }
  },
  livenessScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  depthMap: {
    type: [{
      x: Number,
      y: Number,
      z: Number
    }],
    required: true
  },
  image: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  securityMetrics: {
    spoofingChecks: Boolean,
    livenessVerified: Boolean,
    depthVerified: Boolean,
    lastVerification: Date,
    failedAttempts: {
      type: Number,
      default: 0
    },
    lastFailedAttempt: Date
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
faceAuthSchema.index({ userId: 1 });
faceAuthSchema.index({ lastUpdated: -1 });

// Add method to check if face auth needs update
faceAuthSchema.methods.needsUpdate = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.lastUpdated < thirtyDaysAgo;
};

// Add method to track failed attempts
faceAuthSchema.methods.trackFailedAttempt = async function() {
  this.securityMetrics.failedAttempts += 1;
  this.securityMetrics.lastFailedAttempt = new Date();
  
  if (this.securityMetrics.failedAttempts >= 5) {
    // Disable face auth after 5 failed attempts
    const user = await mongoose.model('User').findById(this.userId);
    if (user) {
      user.hasFaceEnabled = false;
      await user.save();
    }
  }
  
  await this.save();
};

module.exports = mongoose.model('FaceAuth', faceAuthSchema); 