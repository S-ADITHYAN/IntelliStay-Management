const { MenuItem, Table, Order, TableReservation } = require('../models/RestaurantModel');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// View Menu Items with filters and search

exports.getMenuItems = async (req, res) => {
    try {
        const { 
            category, 
            search, 
            specialTags, 
            priceRange,
            sortBy 
        } = req.query;

        let query = { isAvailable: true };

        // Apply filters
        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (specialTags) {
            query.specialTags = { $in: specialTags.split(',') };
        }

        if (priceRange) {
            const [min, max] = priceRange.split('-');
            query.price = { $gte: min, $lte: max };
        }

        // Build sort options
        let sortOptions = {};
        if (sortBy === 'price-asc') sortOptions.price = 1;
        if (sortBy === 'price-desc') sortOptions.price = -1;
        if (sortBy === 'name') sortOptions.name = 1;

        const menuItems = await MenuItem.find(query).sort(sortOptions);
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Menu Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await MenuItem.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Place New Order
exports.placeOrder = async (req, res) => {
    try {
        const { 
            items, 
            orderType, 
            tableNumber, 
            specialInstructions,
            paymentMethod 
        } = req.body;

        // Calculate total amount
        let totalAmount = 0;
        const orderItems = await Promise.all(items.map(async (item) => {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                throw new Error(`Menu item ${item.menuItem} not found`);
            }
            totalAmount += menuItem.price * item.quantity;
            return {
                menuItem: item.menuItem,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            };
        }));

        // Create order
        const order = new Order({
            user_id: req.user._id,
            items: orderItems,
            orderType,
            tableNumber,
            status: 'pending',
            totalAmount,
            paymentStatus: 'pending'
        });

        // Handle payment
        if (paymentMethod === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount * 100, // Convert to cents
                currency: 'usd',
                metadata: { orderId: order._id.toString() }
            });
            
            await order.save();
            res.json({ 
                clientSecret: paymentIntent.client_secret,
                order 
            });
        } else {
            order.paymentStatus = 'completed';
            await order.save();
            res.json({ order });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Table Reservation
exports.reserveTable = async (req, res) => {
    try {
        const { 
            tableNumber, 
            reservationDate, 
            numberOfGuests, 
            specialRequests 
        } = req.body;

        // Check table availability
        const existingReservation = await TableReservation.findOne({
            tableNumber,
            reservationDate: {
                $gte: new Date(reservationDate).setHours(0, 0, 0),
                $lt: new Date(reservationDate).setHours(23, 59, 59)
            },
            status: 'confirmed'
        });

        if (existingReservation) {
            return res.status(400).json({ 
                message: 'Table already reserved for this date' 
            });
        }

        // Check table capacity
        const table = await Table.findOne({ tableNumber });
        if (table.capacity < numberOfGuests) {
            return res.status(400).json({ 
                message: 'Table capacity insufficient' 
            });
        }

        const reservation = new TableReservation({
            user_id: req.user._id,
            tableNumber,
            reservationDate,
            numberOfGuests,
            specialRequests,
            status: 'confirmed'
        });

        await reservation.save();
        res.status(201).json({ 
            message: 'Table reserved successfully', 
            reservation 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get User's Order History
exports.getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.user._id })
            .populate('items.menuItem')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get User's Reservation History
exports.getReservationHistory = async (req, res) => {
    try {
        const reservations = await TableReservation.find({ 
            user_id: req.user._id 
        }).sort({ reservationDate: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ 
            _id: orderId, 
            user_id: req.user._id 
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Cannot cancel order in current status' 
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Handle refund if payment was made
        if (order.paymentStatus === 'completed') {
            // Implement refund logic here
        }

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel Reservation
exports.cancelReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const reservation = await TableReservation.findOne({ 
            _id: reservationId, 
            user_id: req.user._id 
        });

        if (!reservation) {
            return res.status(404).json({ 
                message: 'Reservation not found' 
            });
        }

        // Check if cancellation is within allowed time
        const now = new Date();
        const reservationTime = new Date(reservation.reservationDate);
        const hoursDifference = (reservationTime - now) / (1000 * 60 * 60);

        if (hoursDifference < 2) {
            return res.status(400).json({ 
                message: 'Cannot cancel reservation less than 2 hours before' 
            });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 