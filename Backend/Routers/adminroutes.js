const express = require("express");
const { Adminlogin, staffdetails, asjobdetails, feedbacks, roomdetails, handleMaintenance, handleAvailable, updateroom, lastRoomNumber, addroom, uploadBulkData, addMultipleroommss, resdetails, handleCancellation, user__booking, user_bookings_cancel, user_guests_proofupdate, user_guests_proofupdatess, user_bookings_cancelss, handleCancellationss, resdetailsss, addMultipleroommssss, leave_applicationss, leave_applications_accept, leave_applications_reject, today, checkJobs, assign, staffregister, uploadBulkStaffData, totalUsers, todayLeaveCount, attendance_today, attendance_mark, AddMenuItem, Addmenuitem, getMenuItems, addtable, gettables, updatetable, deletetable, deleteMenuItem, updatemenuitem, getRestaurantOrders, updateOrderStatus, getReservations, updateReservationStatus, getDashboardStats } = require("../Controller/admincontroller");
const router=express.Router();


router.post("/Adminlogin",Adminlogin)
router.post("/staffdetails",staffdetails)
router.post("/asjobdetails",asjobdetails)
router.get("/feedbacks",feedbacks)
router.post("/roomdetails",roomdetails)
router.post("/handleMaintenance",handleMaintenance)
router.post("/handleAvailable",handleAvailable)
// router.post("/updateroom/:id",updateroom)
router.get("/lastRoomNumber/:roomType",lastRoomNumber)
router.post("/addroom",addroom)
// router.post("/uploadBulkData",uploadBulkData)
router.post("/addMultipleRooms",addMultipleroommssss)
router.post("/resdetails",resdetailsss)
router.post("/handleCancellation",handleCancellationss)
router.get("/user-booking/:id",user__booking)
router.post("/user-bookings/cancel/:id",user_bookings_cancelss)
router.post("/user-guests-proofupdate/:id",user_guests_proofupdatess)
router.get('/leave-applications',leave_applicationss)
router.post('/leave-applications/accept/:id',leave_applications_accept)
router.post('/leave-applications/reject/:id',leave_applications_reject)
router.get('/today',today)
router.get('/checkJobs/:role',checkJobs)
router.post('/assign',assign)
router.post('/staffregister',staffregister)
router.post('/uploadBulkStaffData',uploadBulkStaffData)
router.get('/totalUsers',totalUsers)
router.get('/todayLeaveCount',todayLeaveCount)
router.post('/attendance/today',attendance_today)
router.post('/attendance/mark',attendance_mark)
router.post('/menu',Addmenuitem)
router.get('/getmenuitems',getMenuItems)
router.post('/restaurant/tables',addtable)
router.get('/restaurant/tables',gettables)
router.put('/restaurant/tables/:id',updatetable)
router.delete('/restaurant/tables/:id',deletetable)
router.delete('/menu/:id',deleteMenuItem)
router.put('/menu/:id',updatemenuitem)
router.get('/restaurant/orders',getRestaurantOrders)
router.put('/restaurant/orders/status/:orderId',updateOrderStatus)
router.get('/restaurant/reservations',getReservations)
router.put('/restaurant/reservations/status/:reservationId',updateReservationStatus)
router.get('/dashboard-stats',getDashboardStats)

module.exports=router