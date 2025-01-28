const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/menu', restaurantController.getMenu);
router.get('/menu-categories', restaurantController.getMenuCategories);
router.get('/available-tables', restaurantController.getAvailableTables);
router.post('/admin/login', restaurantController.adminLogin);
// Protected routes (require authentication)
router.post('/reservations', verifyToken, restaurantController.createReservation);
router.get('/reservations', verifyToken, restaurantController.getUserReservations);
router.post('/orders', verifyToken, restaurantController.createOrder);
router.get('/orders', verifyToken, restaurantController.getUserOrders);

// Admin routes
router.get('/admin/orders', verifyAdmin, restaurantController.getAllOrders);
router.put('/admin/orders/:orderId', verifyAdmin, restaurantController.updateOrderStatus);
router.get('/admin/reservations', verifyAdmin, restaurantController.getAllReservations);
router.put('/admin/reservations/:reservationId', verifyAdmin, restaurantController.updateReservationStatus);

// Menu management
router.post('/admin/menu', verifyAdmin, restaurantController.addMenuItem);
router.put('/admin/menu/:itemId', verifyAdmin, restaurantController.updateMenuItem);
router.delete('/admin/menu/:itemId', verifyAdmin, restaurantController.deleteMenuItem);

module.exports = router; 