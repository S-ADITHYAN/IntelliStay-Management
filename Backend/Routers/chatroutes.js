const express = require("express");
const { getRooms, getRestaurant, getAllMenuItems, getMenuItemsByCategory, getAllFacilities, getAllPackages } = require("../Controller/chatcontroller");
const router=express.Router();



router.get("/rooms",getRooms)
router.get("/restaurant",getRestaurant)
router.get("/menu",getAllMenuItems)
router.get("/menu/:category",getMenuItemsByCategory)
router.get("/facility",getAllFacilities)
router.get("/package",getAllPackages)

module.exports=router