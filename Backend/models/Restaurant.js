const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: String,
  isOpen: Boolean,
  hours: String,
  specialOfDay: String,
  currentWaitTime: String,
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    autopopulate: true
  }
});

restaurantSchema.pre('find', function() {
  this.populate('menu');
});

restaurantSchema.pre('findOne', function() {
  this.populate('menu');
});

restaurantSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Restaurant', restaurantSchema); 