const { MenuItem, Order, Table, TableReservation } = require('../models/RestaurantModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const restaurantController = {

    adminLogin: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check admin credentials from environment variables
            if (email === process.env.RESTAURANT_ADMIN_EMAIL && 
                password === process.env.RESTAURANT_ADMIN_PASSWORD) {
                
                // Generate JWT token
                const token = jwt.sign(
                    { 
                        role: 'resadmin',
                        email: email 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        email,
                        role: 'resadmin'
                    }
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });

        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    // Menu related controllers
    getMenu: async (req, res) => {
        try {
            const menu = await MenuItem.find();
            res.json(menu);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching menu' });
        }
    },

    getMenuCategories: async (req, res) => {
        try {
            const categories = await MenuItem.distinct('category');
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching categories' });
        }
    },

    // Reservation related controllers
    getAvailableTables: async (req, res) => {
        try {
            const { date, time, guests } = req.query;
            const tables = await Table.find({ 
                capacity: { $gte: guests },
                isAvailable: true 
            });
            res.json(tables);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching tables' });
        }
    },

    createReservation: async (req, res) => {
        try {
            const { tableId, date, time, guests, specialRequests } = req.body;
            const userId = req.user.id;

            const reservation = await TableReservation.create({
                userId,
                tableId,
                date,
                time,
                numberOfGuests: guests,
                specialRequests
            });

            res.status(201).json(reservation);
        } catch (error) {
            res.status(500).json({ message: 'Error creating reservation' });
        }
    },

    getUserReservations: async (req, res) => {
        try {
            const userId = req.user.id;
            const reservations = await TableReservation.find({ userId });
            res.json(reservations);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching reservations' });
        }
    },

    // Order related controllers
    createOrder: async (req, res) => {
        try {
            const { items, totalAmount, deliveryAddress } = req.body;
            const userId = req.user.id;

            const order = await Order.create({
                userId,
                items,
                totalAmount,
                deliveryAddress,
                status: 'PENDING'
            });

            res.status(201).json(order);
        } catch (error) {
            res.status(500).json({ message: 'Error creating order' });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const userId = req.user.id;
            const orders = await Order.find({ userId });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching orders' });
        }
    },

    // Admin controllers
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find().populate('userId', 'name email');
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching all orders' });
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;

            const order = await Order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            );

            res.json(order);
        } catch (error) {
            res.status(500).json({ message: 'Error updating order status' });
        }
    },

    getAllReservations: async (req, res) => {
        try {
            const reservations = await TableReservation.find()
                .populate('userId', 'name email')
                .populate('tableId');
            res.json(reservations);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching all reservations' });
        }
    },

    updateReservationStatus: async (req, res) => {
        try {
            const { reservationId } = req.params;
            const { status } = req.body;

            const reservation = await TableReservation.findByIdAndUpdate(
                reservationId,
                { status },
                { new: true }
            );

            res.json(reservation);
        } catch (error) {
            res.status(500).json({ message: 'Error updating reservation status' });
        }
    },

    // Menu management controllers
    addMenuItem: async (req, res) => {
        try {
            const { name, description, price, category, image } = req.body;
            const menuItem = await MenuItem.create({
                name,
                description,
                price,
                category,
                image
            });
            res.status(201).json(menuItem);
        } catch (error) {
            res.status(500).json({ message: 'Error adding menu item' });
        }
    },

    updateMenuItem: async (req, res) => {
        try {
            const { itemId } = req.params;
            const update = req.body;

            const menuItem = await MenuItem.findByIdAndUpdate(
                itemId,
                update,
                { new: true }
            );

            res.json(menuItem);
        } catch (error) {
            res.status(500).json({ message: 'Error updating menu item' });
        }
    },

    deleteMenuItem: async (req, res) => {
        try {
            const { itemId } = req.params;
            await MenuItem.findByIdAndDelete(itemId);
            res.json({ message: 'Menu item deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting menu item' });
        }
    },

    // Payment controllers
    createPayment: async (req, res) => {
        try {
            // Payment creation logic here
            res.status(501).json({ message: 'Payment creation not implemented' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating payment' });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            // Payment verification logic here
            res.status(501).json({ message: 'Payment verification not implemented' });
        } catch (error) {
            res.status(500).json({ message: 'Error verifying payment' });
        }
    }
};

module.exports = restaurantController; 