const express = require("express");
const { stafflogin, send_otp, staff_verify, staff_reset_password, applyleave, reservations_todays_reservations, reservations_verify, reservations_checkin, reservations_todays_checkouts, reservations_checkout, staff_confirmbook, staff_profile, staff_profile_get, staff_change_password, staff_upload_photo, resdetails, handleCancellation, staff_rooms_available, staff_rooms_types, pickJob, completeJob, jobdetail, asjobdetails, leaveDetails, leaveDetail, deleteLeave, staff_profile_put, profile_put } = require("../Controller/staffcontroller");
const router=express.Router();



router.post("/stafflogin",stafflogin)
router.post("/staff-send-otp",send_otp)
router.post("/staff-verify",staff_verify)
router.post("/staff-reset-password",staff_reset_password)
router.post("/applyleave",applyleave)
router.get("/reservations/todays-reservations",reservations_todays_reservations)
router.put("/reservations/verify/:id",reservations_verify)
router.put("/reservations/checkin",reservations_checkin)
router.get("/reservations/todays-checkouts",reservations_todays_checkouts)
router.put("/reservations/checkout/:reservationId",reservations_checkout)
router.post("/staff/confirmbook",staff_confirmbook)
router.get("/staff/profile/:id",staff_profile_get)
router.put("/staff/profile/:id",profile_put)
router.put("/staff/change-password/:id",staff_change_password)
router.post("/staff/upload-photo/:id",staff_upload_photo)
router.post("/resdetails",resdetails)
router.post("/handleCancellation",handleCancellation)
router.get("/staff/rooms/available",staff_rooms_available)
router.get("/staff/rooms/types",staff_rooms_types)
router.post("/pickJob",pickJob)
router.post("/completeJob",completeJob)
router.get("/jobdetail/:id",jobdetail)
router.post("/asjobdetails",asjobdetails)
router.post("leaveDetails/:userId",leaveDetails)
router.get("/leaveDetail/:leaveId",leaveDetail)
router.delete("/deleteLeave/:leaveId",deleteLeave)






module.exports=router