const mongoose = require('mongoose');


// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String,
        required: true
    },
    price: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String, 
        required: true,
        
    },
    foodtype: {
        type: String,
        enum: ['Veg', 'Non-Veg'],
        required: true
    },
    image: { 
        type: String,
        required: true
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    preparationTime: { 
        type: Number,
        default: 30 
    },
    specialTags: {
        type: [String],
        default: []
    },
    spicyLevel: {
        type: String,
        enum: ['Not Spicy', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
        default: 'Not Spicy'
    },
    quantity: {
        type: Number,
        default: 1
    },
    availableQuantity: {
        type: Number,
        default: function() {
            return this.quantity; // Initially set to match quantity
        }
    },
    lastResetDate: {
        type: Date,
        default: Date.now
    },
    model3D: {
        type: String,
        default: null
    },
    model3DPath: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Add middleware to check and reset available quantity
menuItemSchema.pre('save', async function(next) {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = new Date(this.lastResetDate).setHours(0, 0, 0, 0);
    
    // If it's a new day, reset availableQuantity
    if (today > lastReset) {
        this.availableQuantity = this.quantity;
        this.lastResetDate = new Date();
    }
    next();
});

// Method to update available quantity after order
menuItemSchema.methods.updateAvailableQuantity = async function(orderedQuantity) {
    if (this.availableQuantity >= orderedQuantity) {
        this.availableQuantity -= orderedQuantity;
        await this.save();
        return true;
    }
    return false;
};

// Order Schema
const orderSchema = new mongoose.Schema({
      user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoogleRegisters',
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    specialInstructions: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentDetails: {
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    required: true
},
deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
},
cancellationDetails: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoogleRegisters'
    },
    reason: String
  },
  tablereservation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableReservation'
  },
  deliveryDetails: {
    roomNumber: String,
    reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reservation'
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'room'
    },
    deliveryInstructions: String,
    estimatedDeliveryTime: Date
  }
}, { timestamps: true });




// Table Schema
const tableSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    location: {
        type: String,
        enum: ['Indoor', 'Outdoor', 'Balcony'],
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
        default: 'Available'
    }
}, { timestamps: true });

// Reservation Schema
// const reservationSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     tableNumber: {
//         type: String,
//         required: true
//     },
//     reservationDate: {
//         type: Date,
//         required: true
//     },
//     numberOfGuests: {
//         type: Number,
//         required: true,
//         min: 1
//     },
//     specialRequests: String,
//     status: {
//         type: String,
//         enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
//         default: 'PENDING'
//     }
// }, { timestamps: true });

// Create models
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);
const Table = mongoose.model('Table', tableSchema);
// const TableReservation = mongoose.model('TableReservation', reservationSchema);

module.exports = {
    MenuItem,
    Order,
    Table
    
}; 