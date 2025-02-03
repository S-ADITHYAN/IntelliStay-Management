const mongoose = require('mongoose');

//cartSchema
const cartSchema = mongoose.Schema({
  
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    availableQuantity: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoogleRegister',
        required: true
    },
    specialInstructions: {
        type: String,
    },
    cartTotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate subTotal before saving
cartSchema.pre('save', function(next) {
    this.subTotal = this.price * this.quantity;
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;