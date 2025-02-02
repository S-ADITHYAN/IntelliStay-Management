require("dotenv").config()
const passport = require("passport");
const multer = require('multer');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const GoogleRegisterModel = require("../models/GooglesignModel");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const RegisterModel=require("../models/RegisterModel");
const cookieParser=require("cookie-parser");
const bodyParser=require("body-parser");
const jwt=require("jsonwebtoken");
const RoomModel = require("../models/RoomModel");
const ReservationModel = require("../models/ReservationModel");
const StaffModel = require("../models/StaffModel");
const crypto = require('crypto');
const HousekeepingJobModel=require("../models/HousekeepingJobModel")
const LeaveApplicationModel=require("../models/LeaveApplicationModel")
const AttendanceModel=require("../models/AttendenceModel");
const MaintenanceJobModel = require("../models/MaintenanceJobmodel");
const nodemailer = require('nodemailer');
const RoomGuestModel=require('../models/Guestroom')
const BillModel=require('../models/BillModel')
const FeedbackModel=require('../models/FeedbackModel')
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { MenuItem, Table,TableReservation,Order } = require('../models/RestaurantModel');
const Cart=require('../models/Cart')
const Razorpay = require('razorpay');
const FacilityModel = require('../models/Facility');
const PackageModel = require('../models/Package');
const RestaurantModel = require('../models/Restaurant');

exports.getRooms = async (req, res) => {
    try {
      // Get distinct room types with their details
      const rooms = await RoomModel.aggregate([
        // Get first document for each unique roomType
        {
          $group: {
            _id: "$roomtype",
            // Get all fields from the first document of each roomType
            roomDetails: { 
              $first: {
                roomtype: "$roomtype",
                rate: "$rate",
                description: "$description",
                allowedAdults: "$allowedAdults",
                allowedChildren: "$allowedChildren",
                amenities: "$amenities",
                status: "$status"
              }
            }
          }
        },
        // Reshape the output
        {
          $replaceRoot: { 
            newRoot: "$roomDetails" 
          }
        },
        // Sort by roomType
        {
          $sort: { 
            roomtype: 1 
          }
        }
      ]);

      console.log('Unique room types:', rooms);
      res.status(200).json(rooms);
      
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: 'Error fetching rooms data' });
    }
  };

  exports.getRestaurant = async (req, res) => {
    try {
        // Get restaurant details
        const restaurant = await RestaurantModel.findOne().lean();
    
        // Get all menu items
        const menuItems = await MenuItem.find({ isAvailable: true }).lean();
    
        // Group menu items by category
        const menuByCategory = menuItems.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push({
            name: item.name,
            price: item.price,
            description: item.description,
            isAvailable: item.isAvailable,
            isVegetarian: item.isVegetarian,
            spiceLevel: item.spiceLevel,
            preparationTime: item.preparationTime
          });
          return acc;
        }, {});
    
        // Format the response
        const formattedResponse = {
          name: restaurant.name,
          isOpen: restaurant.isOpen,
          hours: restaurant.hours,
          specialOfDay: restaurant.specialOfDay,
          currentWaitTime: restaurant.currentWaitTime,
          menu: Object.entries(menuByCategory).map(([category, items]) => ({
            categoryName: category,
            items: items
          }))
        };
    
        res.status(200).json(formattedResponse);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        res.status(500).json({ message: 'Error fetching restaurant data' });
      }
  };
  
  // Get all menu items
  exports.getAllMenuItems = async (req, res) => {
    try {
      const menu = await MenuItem.find({isAvailable:true});
    //   const allItems = menu.getAllItems();
      res.status(200).json(menu);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  };
  
  // Get items by category
  exports.getMenuItemsByCategory = async (req, res) => {
    try {
      const { categoryName } = req.params;
      const menu = await MenuItem.find({isAvailable:true});
      const category = menu.categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      res.status(200).json(category.items);
    } catch (error) {
      console.error('Error fetching category items:', error);
      res.status(500).json({ message: 'Error fetching category items' });
    }
  };

  exports.getAllFacilities = async (req, res) => {
    try {
      const facilities = await FacilityModel.find()
        .select('-__v')
        .lean();
  
      // Format operating hours and status for each facility
      const formattedFacilities = facilities.map(facility => ({
        ...facility,
        isCurrentlyOpen: isOpen(facility.operatingHours),
        availabilityStatus: getAvailabilityStatus(facility)
      }));
  
      res.status(200).json(formattedFacilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      res.status(500).json({ message: 'Error fetching facilities data' });
    }
  };
  
  // Helper function to check if facility is currently open
  const isOpen = (hours) => {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const operatingHours = isWeekend ? hours.weekendHours : hours;
    const openTime = parseInt(operatingHours.open.replace(':', ''));
    const closeTime = parseInt(operatingHours.close.replace(':', ''));
    
    return currentTime >= openTime && currentTime <= closeTime;
  };
  
  // Helper function to get detailed availability status
  const getAvailabilityStatus = (facility) => {
    if (facility.status === 'Under Maintenance' || facility.status === 'Closed') {
      return facility.status;
    }
    
    if (facility.currentCapacity) {
      const occupancyPercentage = (facility.currentCapacity.current / facility.currentCapacity.maximum) * 100;
      if (occupancyPercentage >= 90) {
        return 'Almost Full';
      } else if (occupancyPercentage >= 50) {
        return 'Moderately Busy';
      }
    }
    
    return 'Available';
  };

  exports.getAllPackages = async (req, res) => {
    try {
      const packages = await PackageModel.find({
        'validityPeriod.endDate': { $gte: new Date() }
      })
      .select('-__v')
      .lean();
  
      // Format packages with additional information
      const formattedPackages = packages.map(pkg => ({
        ...pkg,
        isAvailable: checkAvailability(pkg),
        currentPrice: calculateDiscountedPrice(pkg),
        daysRemaining: getDaysRemaining(pkg.validityPeriod.endDate)
      }));
  
      res.status(200).json(formattedPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ message: 'Error fetching packages data' });
    }
  };
  
  // Helper function to check package availability
  const checkAvailability = (pkg) => {
    const now = new Date();
    return pkg.availability && 
           now >= pkg.validityPeriod.startDate && 
           now <= pkg.validityPeriod.endDate;
  };
  
  // Helper function to calculate discounted price
  const calculateDiscountedPrice = (pkg) => {
    if (pkg.discount && pkg.discount.validUntil >= new Date()) {
      const discountAmount = (pkg.price.amount * pkg.discount.percentage) / 100;
      return {
        original: pkg.price.amount,
        discounted: pkg.price.amount - discountAmount,
        savings: discountAmount,
        currency: pkg.price.currency
      };
    }
    return {
      original: pkg.price.amount,
      currency: pkg.price.currency
    };
  };
  
  // Helper function to get days remaining for package validity
  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const diffTime = endDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

exports.handleChatResponse = async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    // Initialize response object
    let response = {
      text: '',
      data: null,
      type: 'text'
    };

    // Pattern matching for different queries
    if (lowerMessage.includes('room') || lowerMessage.includes('accommodation')) {
      const rooms = await RoomModel.find()
        .select('roomType rate description available allowedAdults allowedChildren')
        .lean();
      
      response = {
        text: 'Here are our available rooms:',
        data: rooms,
        type: 'rooms'
      };
    }
    
    else if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('dining')) {
      const restaurant = await RestaurantModel.findOne().lean();
      const menuItems = await MenuItem.find({ isAvailable: true }).lean();
      
      response = {
        text: 'Here are our restaurant details and menu:',
        data: {
          restaurant,
          menuItems: groupMenuByCategory(menuItems)
        },
        type: 'restaurant'
      };
    }
    
    else if (lowerMessage.includes('facility') || lowerMessage.includes('amenities')) {
      const facilities = await FacilityModel.find().lean();
      
      response = {
        text: 'Here are our facilities:',
        data: facilities.map(facility => ({
          ...facility,
          isCurrentlyOpen: isOpen(facility.operatingHours),
          availabilityStatus: getAvailabilityStatus(facility)
        })),
        type: 'facilities'
      };
    }
    
    else if (lowerMessage.includes('package') || lowerMessage.includes('deal')) {
      const packages = await PackageModel.find({
        'validityPeriod.endDate': { $gte: new Date() }
      }).lean();
      
      response = {
        text: 'Here are our current packages:',
        data: packages.map(pkg => ({
          ...pkg,
          isAvailable: checkAvailability(pkg),
          currentPrice: calculateDiscountedPrice(pkg)
        })),
        type: 'packages'
      };
    }
    
    else {
      response.text = "I can help you with information about our rooms, restaurant, facilities, and special packages. What would you like to know?";
    }

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message 
    });
  }
};