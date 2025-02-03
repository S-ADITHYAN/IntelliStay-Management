const mongoose = require('mongoose');

//tablereservationSchema
const tablereservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoogleRegisters',
        required: true
    },
    table_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    tableNumber: {
        type: String,
        required: true
    },
    reservationDate: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1
    },
    specialRequests: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TableReservation', tablereservationSchema);