const express = require("express");
const { authlogin, authwithgoogle, authlogout, register, verify_otp, reset_password, send_otp, verify, checkrooms, rooms_details, previousGuestDetails, saved_guests, update_guest, profile, upload_photo, change_password, profile_update, my_bookings, user_booking, bookings_cancel, guests_proofupdate, feedback, confirmbook, orders_create, reservations, orders, ordersss, guests_proofupdatess, getMenuItems, getMenuItemss, getCategoriess, cart_add, get_cart_items, remove_cart_item, update_cart_quantity, createOrder, createOrderInDB, clearCart, verifyPayment, getOrderDetails, getMyOrders, cancelOrder, getAllTables, getTable, createTableReservation, getUserReservations, getConfirmedReservations, processQRCode, generateQRCode, getUserReservation, deleteGuest, saveFace, getFaceAuthStatus, disableFace, verifyFace, getUpcomingReservations, getUserBookedRooms, searchByImage, getRecommendations } = require("../Controller/usercontroller");
const router=express.Router();


router.post("/login",authlogin)
router.post("/authWithGoogle",authwithgoogle)
router.post("/logout",authlogout)
router.post("/register",register)
router.post("/verify-otp",verify_otp)
router.post("/reset-password",reset_password)
router.post("/send-otp",send_otp)
router.post("/verify",verify)
router.post("/checkrooms",checkrooms)
router.post("/rooms-details",rooms_details)
router.get("/previousGuestDetails/:id",previousGuestDetails)
router.get("/saved-guests/:userId",saved_guests)
router.put("/update-guest/:id",update_guest)
router.get("/profile/:id",profile)
router.post("/upload-photo/:id",upload_photo)
router.put("/change-password/:id",change_password)
router.post("/profile/update/:id",profile_update)
router.get("/my-bookings/:userId",my_bookings)
router.get("/user-booking/:id",user_booking)
router.post("/user-bookings/cancel/:id",bookings_cancel)
router.post("/guests-proofupdatess/:id",guests_proofupdatess)
router.post("/feedback",feedback)
router.post("/confirmbook",confirmbook)
router.post("/orders/create",ordersss)
router.delete("/reservations/:id",reservations)
router.get("/restaurant/menuitems",getMenuItemss)
router.get('/restaurant/categoriess', getCategoriess);
router.post("/restaurant/cart/add",cart_add)
router.get("/restaurant/cart/:userId",get_cart_items)
router.delete("/restaurant/cart/remove/:cartItemId",remove_cart_item)
router.put("/restaurant/cart/update/:cartItemId",update_cart_quantity)
router.post("/restaurant/create-order",createOrder)
router.post("/restaurant/verify-payment",verifyPayment)
router.post("/restaurant/orders",createOrderInDB) 
router.delete("/restaurant/clear",clearCart)
router.get("/restaurant/my-orders/:userId",getMyOrders)
router.get("/restaurant/orderdetails/:orderId",getOrderDetails)    
router.put("/restaurant/orders/cancel/:orderId",cancelOrder)
router.get("/restaurant/tables",getAllTables)
router.get("/restaurant/table/:id",getTable)
router.post("/restaurant/table-reservations",createTableReservation)
router.get("/restaurant/user-reservations/:userId",getUserReservations)
router.get("/restaurant/confirmed-reservations",getConfirmedReservations)
// router.post("/restaurant/cart/checkout",checkout)
router.get("/reservations/:reservationId",getUserReservation)
router.post("/qr/generate",generateQRCode)
router.post("/qr/process",processQRCode)
router.delete("/delete-guest/:id",deleteGuest)
router.post("/save-face",saveFace)
router.get("/face-auth-status/:userId",getFaceAuthStatus)
router.delete("/disable-face/:userId",disableFace)
router.post("/verify-face",verifyFace)
router.get("/restaurant/reservations/:userId",getUpcomingReservations)
router.get('/booked-rooms/:userId', getUserBookedRooms);
router.post('/rooms/search-by-image', searchByImage);
router.get('/recommendations', getRecommendations);




module.exports=router