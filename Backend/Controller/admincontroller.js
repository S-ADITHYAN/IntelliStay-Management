require("dotenv").config()
const passport = require("passport");
const { MenuItem, Table, Order, TableReservation } = require('../models/RestaurantModel');
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
const TableReservationModel=require('../models/TableReservation')


exports.Adminlogin= (req, res) => {
    const { emailsign, passwordsign } = req.body;
   
            if (emailsign==='admin@gmail.com' ) {
                if (passwordsign==='Admin123@') {
                  
                    const token = jwt.sign({email:'admin@gmail.com'}, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",token: token});
                    
                } else {
                    res.json("the password is incorrect");
                }
            } else {
                res.json("No user found :(");
            }
        
        
};



exports.staffdetails= async (req, res) => {
    try {
        
        let staff = await StaffModel.find().select('-password');
        
        if (staff && staff.length > 0) {
            return res.status(200).json(staff); 
        } else {
            return res.status(404).json({ message: "No staffs are added" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); 
    }
};

exports.asjobdetails= async (req, res) => {
    try {
        // Fetch all housekeeping jobs
        const housekeepingJobs = await HousekeepingJobModel.find().lean();
        
        // Fetch all maintenance jobs
        const maintenanceJobs = await MaintenanceJobModel.find().lean();

        // Combine both job details
        const allJobs = [...housekeepingJobs, ...maintenanceJobs];

        // If no jobs are found, send an empty array
        if (allJobs.length === 0) {
            return res.status(200).json([]);
        }

        // Array to hold job details with room number and staff details
        const jobDetailsWithRoomNoAndStaff = await Promise.all(
            allJobs.map(async (job) => {
                // Find the room based on roomId
                const room = await RoomModel.findById(job.room_id).lean();

                // Find the staff based on staffId
                const staff = await StaffModel.findById(job.staff_id).lean();

                // Return an object with desired fields
                return {
                    _id: job._id,
                    roomNo: room ? room.roomno : 'Unknown', // Fallback if room is not found
                    taskDescription: job.task_description,
                    taskDate: job.task_date,
                    status: job.status,
                    photos: job.photos,
                    maintenanceRequired: job.maintenanceRequired,
                    completedAt: job.completedAt,
                    staffDisplayName: staff ? staff.displayName : 'Unknown', // Fallback if staff is not found
                    staffRole: staff ? staff.role : 'Unknown', // Fallback if staff is not found
                    staffEmail: staff ? staff.email : 'Unknown' // Fallback if staff is not found
                };
            })
        );

        // Respond with the job details including room number and staff details
        res.status(200).json(jobDetailsWithRoomNoAndStaff);
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.feedbacks= async (req, res) => {
    console.log("Fetching feedbacks...");
    try {
        const feedbacks = await FeedbackModel.find()
            .populate('userId', 'displayName email') // Populate user details from GoogleRegisters
            .populate('reservationId')
            .sort({ submittedDate: -1 }) // Populate reservation details if needed
            .exec();
        console.log(feedbacks)
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ message: 'An error occurred while fetching feedbacks.' });
    }
  };

  exports.roomdetails= async (req, res) => {
    try {
        let rooms = await RoomModel.find();
        
        if (rooms && rooms.length > 0) {
            
            return res.status(200).json(rooms); // sending room details
        } else {
            return res.status(404).json({ message: "No rooms are available" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
};

exports.handleMaintenance=async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Room ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await RoomModel.updateOne(
            { _id: id }, 
            { $set: { status: "maintenance" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Room not found or status already set to maintenance.");
        }

        return res.status(200).json("Room status updated successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
};

exports.handleAvailable = async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Room ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await RoomModel.updateOne(
            { _id: id }, 
            { $set: { status: "available" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Room not found or status already set to available.");
        }

        return res.status(200).json("Room status updated successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
};

// Configure Cloudinary storage for room images
const roomImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rooms',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Configure Cloudinary storage for bulk room uploads
const bulkRoomStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hotel_rooms_bulk',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

const menuImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Initialize multer with Cloudinary storage
const uploadRoomImages = multer({ 
  storage: roomImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadBulkRoomImages = multer({ 
  storage: bulkRoomStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadmenuImages = multer({ 
  storage: menuImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Add single room with images
exports.addroom = [
  uploadRoomImages.array('images', 10),
  async (req, res) => {
    try {
      const { roomno, roomtype, status, rate, description, allowedGuests, allowedChildren, amenities } = req.body;
      
      // Check if room already exists
      let room = await RoomModel.findOne({ roomno: roomno });
      if (room) {
        return res.json("exists");
      }

      // Get Cloudinary URLs from uploaded files
      const imageUrls = req.files ? req.files.map(file => file.path) : [];

      // Create new room with Cloudinary URLs
      room = new RoomModel({
        roomno,
        roomtype,
        status,
        rate,
        description,
        images: imageUrls,
        allowedAdults: allowedGuests,
        allowedChildren,
        amenities
      });

      await room.save();
      return res.status(200).json("Room added successfully");
    } catch (error) {
      console.error('Error adding room:', error);
      return res.status(500).json({ error: error.message });
    }
  }
];

// Menu Item Management
exports.Addmenuitem = [
    uploadmenuImages.single('image'), // Handle file upload
    async (req, res) => {
        try {
          // await console.log('hello');
          //   await console.log('Request body:', JSON.stringify(req.body));
          //   await console.log('File:', req.file);
  
            const {
                name,
                description,
                price,
                category,
                preparationTime,
                specialTags,
                spicyLevel,
                isAvailable,
                foodType,
                quantity
            } = req.body;
              
            // Validate required fields
            if (!name || !description || !price || !category || !foodType || !quantity) {
                return res.status(400).json({
                    error: 'Missing required fields: name, description, price, category, foodType, and quantity are required'
                });
            }
  
            // Parse special tags if provided
            let parsedSpecialTags = [];
            try {
                parsedSpecialTags = specialTags ? JSON.parse(specialTags) : [];
            } catch (e) {
                return res.status(400).json({
                    error: 'Invalid format for specialTags. Must be a JSON array.'
                });
            }
  
            // Get image URL if file uploaded
            const imageUrl = req.file ? req.file.path : null;
  
            // Create new menu item
            const menuItem = new MenuItem({
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                category: category.trim(),
                image: imageUrl,
                preparationTime: preparationTime ? parseInt(preparationTime) : 30,
                specialTags: parsedSpecialTags,
                spicyLevel: spicyLevel || 'Not Spicy',
                isAvailable: isAvailable === 'true',
                foodtype: foodType,
                quantity: quantity
            });
  
            // Save the menu item to the database
            const savedMenuItem = await menuItem.save();
            console.log('Saved menu item:', savedMenuItem);
  
            return res.status(201).json({
                message: 'Menu item added successfully',
                menuItem: savedMenuItem
            });
        } catch (error) {
            await console.error('Error adding menu item:', error.stack || error.message);
            return res.status(500).json({
                error: 'Internal server error while adding menu item',
            });
        }
    }
  ];
  

//delete menu item
exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if menu item exists
        const menuItem = await MenuItem.findById(id);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Check for active orders containing this menu item
        const activeOrders = await Order.find({
            'items.menuItem': id,
            status: { 
                $in: ['pending', 'confirmed', 'preparing', 'ready'] 
            }
        }).select('orderNumber status items.quantity');

        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete menu item with active orders',
                details: {
                    activeOrdersCount: activeOrders.length,
                    orderNumbers: activeOrders.map(order => order.orderNumber),
                    suggestion: 'Please wait until all active orders are completed or mark the item as unavailable instead'
                }
            });
        }

        // Check for completed orders in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrders = await Order.find({
            'items.menuItem': id,
            status: 'completed',
            createdAt: { $gte: thirtyDaysAgo }
        }).countDocuments();

        // If there are recent orders, mark as inactive instead of deleting
        if (recentOrders > 0) {
            const updatedMenuItem = await MenuItem.findByIdAndUpdate(
                id,
                { 
                    isAvailable: false,
                    isArchived: true,
                    archivedAt: new Date(),
                    archiveReason: 'Marked for deletion but preserved for order history'
                },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Menu item archived successfully due to recent order history',
                data: updatedMenuItem,
                note: 'Item has been archived instead of deleted to preserve order history'
            });
        }

        // If no recent orders, proceed with deletion
        // Delete image from cloudinary if exists
        if (menuItem.image) {
            try {
                const publicId = menuItem.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.error('Error deleting image from cloudinary:', cloudinaryError);
            }
        }

        // Delete the menu item
        await MenuItem.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully',
            data: menuItem
        });

    } catch (error) {
        console.error('Error in menu item deletion:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting menu item',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

//update menu item
exports.updatemenuitem = [
  uploadmenuImages.single('image'), 
  async (req, res) => {
      try {
          const { id } = req.params;
          console.log('Request Body:', req.body);
          
          // Check if menu item exists
          const existingItem = await MenuItem.findById(id);
          if (!existingItem) {
              return res.status(404).json({
                  success: false,
                  message: 'Menu item not found'
              });
          }

          // Validate price
          const price = parseFloat(req.body.price);
          if (isNaN(price) || price <= 0) {
              return res.status(400).json({
                  success: false,
                  message: 'Invalid price value. Price must be a positive number.'
              });
          }

          // Validate preparation time
          const prepTime = parseInt(req.body.preparationTime);
          if (isNaN(prepTime) || prepTime < 0) {
              return res.status(400).json({
                  success: false,
                  message: 'Invalid preparation time. Must be a non-negative number.'
              });
          }

          // Prepare update data
          const updateData = {
              name: req.body.name?.trim(),
              description: req.body.description?.trim(),
              price: price,
              category: req.body.category?.trim(),
              preparationTime: prepTime,
              specialTags: req.body.specialTags ? JSON.parse(req.body.specialTags) : [],
              spicyLevel: req.body.spicyLevel,
              isAvailable: req.body.isAvailable === 'true',
              updatedAt: new Date()
          };

          // Handle image update if new image is uploaded
          if (req.file) {
              try {
                  // Delete old image from cloudinary if exists
                  const oldImagePublicId = existingItem.image?.split('/').pop().split('.')[0];
                  if (oldImagePublicId) {
                      await cloudinary.uploader.destroy(oldImagePublicId);
                  }

                  // Upload new image
                  const result = await cloudinary.uploader.upload(req.file.path, {
                      folder: 'menu-items',
                      width: 1200,
                      height: 800,
                      crop: "limit",
                      quality: "auto"
                  });

                  // Store only the secure URL in the image field
                  updateData.image = result.secure_url;
              } catch (cloudinaryError) {
                  console.error('Cloudinary error:', cloudinaryError);
                  return res.status(500).json({
                      success: false,
                      message: 'Error processing image upload'
                  });
              }
          }

          console.log('Update Data:', updateData); // Debug log

          // Update the menu item
          const updatedItem = await MenuItem.findByIdAndUpdate(
              id,
              updateData,
              { 
                  new: true,
                  runValidators: true 
              }
          );

          if (!updatedItem) {
              return res.status(404).json({
                  success: false,
                  message: 'Menu item not found after update'
              });
          }

          res.status(200).json({
              success: true,
              message: 'Menu item updated successfully',
              data: updatedItem
          });

      } catch (error) {
          console.error('Error updating menu item:', error);

          if (error.name === 'SyntaxError') {
              return res.status(400).json({
                  success: false,
                  message: 'Invalid data format for specialTags'
              });
          }

          if (error.name === 'ValidationError') {
              return res.status(400).json({
                  success: false,
                  message: 'Validation Error',
                  errors: Object.values(error.errors).map(err => err.message)
              });
          }

          if (error.name === 'CastError') {
              return res.status(400).json({
                  success: false,
                  message: `Invalid data format for field: ${error.path}`,
                  details: error.message
              });
          }

          res.status(500).json({
              success: false,
              message: 'Error updating menu item',
              error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
      }
  }
];

// Add multiple rooms with images
exports.addMultipleroommssss = [
  uploadBulkRoomImages.array('imagessssss', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Get Cloudinary URLs from uploaded files
      const imageUrls = req.files.map(file => file.path);
      const rooms = req.body;

      // Get the last room number from the database
      const lastRoom = await RoomModel.findOne().sort({ roomno: -1 }).exec();
      const lastRoomNumber = lastRoom ? parseInt(lastRoom.roomno, 10) : 200;

      const savedRooms = [];
      const errors = [];

      // Create multiple rooms with the same images
      for (let i = 0; i < rooms.numberOfRooms; i++) {
        const newRoomNo = lastRoomNumber + i + 1;

        if (!rooms.roomTypeToAdd || !rooms.commonStatus || !rooms.commonRate || !rooms.commonDescription) {
          errors.push({ roomno: newRoomNo, error: 'Missing required fields' });
          continue;
        }

        const newRoom = new RoomModel({
          roomno: newRoomNo,
          roomtype: rooms.roomTypeToAdd,
          status: rooms.commonStatus,
          rate: rooms.commonRate,
          description: rooms.commonDescription,
          images: imageUrls,
          allowedAdults: rooms.allowedGuests,
          allowedChildren: rooms.allowedChildren,
          amenities: rooms.commonamenities,
        });

        try {
          const savedRoom = await newRoom.save();
          savedRooms.push(savedRoom);
        } catch (error) {
          errors.push({ roomno: newRoomNo, error: error.message });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Some rooms could not be added', 
          errors 
        });
      }

      res.status(201).json({ 
        success: true, 
        message: 'Rooms added successfully', 
        savedRooms 
      });
    } catch (error) {
      console.error('Error adding multiple rooms:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add rooms', 
        error: error.message 
      });
    }
  }
];

// Update room with new images
exports.updateRoom = [
  uploadRoomImages.array('images', 10),
  async (req, res) => {
    try {
      const roomId = req.params.id;
      const { roomno, roomtype, status, rate, description, existingImages } = req.body;

      const room = await RoomModel.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Get new Cloudinary URLs from uploaded files
      const newImageUrls = req.files ? req.files.map(file => file.path) : [];

      // Delete removed images from Cloudinary
      const existingImageUrls = JSON.parse(existingImages || '[]');
      const removedImages = room.images.filter(img => !existingImageUrls.includes(img));
      
      for (const imageUrl of removedImages) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }

      // Combine existing and new images
      const updatedImages = [...existingImageUrls, ...newImageUrls];

      // Update room with new data
      const updatedRoom = await RoomModel.findByIdAndUpdate(
        roomId,
        {
          roomno,
          roomtype,
          status,
          rate,
          description,
          images: updatedImages
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Room updated successfully',
        room: updatedRoom
      });
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ 
        message: 'Error updating room', 
        error: error.message 
      });
    }
  }
];

// Delete room and its images
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await RoomModel.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete all images from Cloudinary
    for (const imageUrl of room.images) {
      try {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    // Delete room from database
    await RoomModel.findByIdAndDelete(roomId);

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ 
      message: 'Error deleting room', 
      error: error.message 
    });
  }
};

exports.getMenuItems = async (req, res) => {try {
  const menuItems = await MenuItem.find({})
      .sort({ category: 1, name: 1 }); // Sort by category, then by name
  res.json(menuItems);
} catch (error) {
  console.error('Error fetching menu items:', error);
  res.status(500).json({ 
      message: 'Failed to fetch menu items',
      error: error.message 
  });
}
};

exports.lastRoomNumber= async (req, res) => {
    const { roomType } = req.params;
  
    try {
        const lastRoom = await RoomModel.findOne({ roomtype: roomType }).sort({ roomno: -1 }).limit(1);
        const lastRoomNumber = lastRoom ? lastRoom.roomno : 0; // Return 0 if no rooms exist of that type
        res.status(200).json({ lastRoomNumber });
    } catch (error) {
        console.error("Error fetching last room number:", error);
        res.status(500).json({ message: 'Server error while fetching last room number' });
    }
  };

exports.addtable= async (req, res) => {
  try {
    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber: req.body.tableNumber });
    if (existingTable) {
        return res.status(400).json({
            success: false,
            message: 'Table number already exists'
        });
    }

    // Create new table
    const newTable = new Table({
        tableNumber: req.body.tableNumber,
        capacity: req.body.capacity,
        location: req.body.location,
        status: req.body.status
    });

    // Save table to database
    const savedTable = await newTable.save();

    res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: savedTable
    });

} catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({
        success: false,
        message: 'Error creating table',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
}
};

exports.gettables= async (req, res) => {
  try {
    // Fetch all tables and sort by table number
    const tables = await Table.find({})
        .sort({ tableNumber: 1 })
        .select('-__v'); // Exclude version key

    // Return success response
    res.status(200).json({
        success: true,
        count: tables.length,
        data: tables
    });

} catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
        success: false,
        message: 'Error fetching tables',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
}
};

exports.updatetable= async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, location, status } = req.body;

    // Check if table exists
    const existingTable = await Table.findById(id);
    if (!existingTable) {
        return res.status(404).json({
            success: false,
            message: 'Table not found'
        });
    }

    // Check if new table number already exists (excluding current table)
    if (tableNumber !== existingTable.tableNumber) {
        const duplicateTable = await Table.findOne({ 
            tableNumber, 
            _id: { $ne: id } 
        });
        
        if (duplicateTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists'
            });
        }
    }

    // Update table
    const updatedTable = await Table.findByIdAndUpdate(
        id,
        {
            tableNumber,
            capacity,
            location,
            status
        },
        {
            new: true, // Return updated document
            runValidators: true // Run model validators
        }
    );

    res.status(200).json({
        success: true,
        message: 'Table updated successfully',
        data: updatedTable
    });

} catch (error) {
    console.error('Error updating table:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(error.errors).map(err => err.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error updating table',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
}
};

exports.deletetable= async (req, res) => {
  try {
    const { id } = req.params;

    // Check if table exists
    const table = await Table.findById(id);
    
    if (!table) {
        return res.status(404).json({
            success: false,
            message: 'Table not found'
        });
    }

    // Check if table can be deleted (optional: add your business logic here)
    if (table.status === 'Reserved' || table.status === 'Occupied') {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete table that is currently reserved or occupied'
        });
    }

    // Delete the table
    await Table.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Table deleted successfully',
        data: table
    });

} catch (error) {
    console.error('Error deleting table:', error);
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid table ID format'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error deleting table',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
}
};

exports.resdetailsss= async (req, res) => {
    try {
        // Fetch all reservations sorted in reverse order based on _id
        let reservations = await ReservationModel.find().sort({ _id: -1 });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "No reservations found" });
        }

        // Extract user_ids and room_ids from reservations
        const userIds = reservations.map(reservation => reservation.user_id);
        const roomIds = reservations.map(reservation => reservation.room_id);

        // Fetch user details for the extracted user_ids
        const users = await GoogleRegisterModel.find({ _id: { $in: userIds } }).select('-password'); // Exclude password

        // Fetch room details for the extracted room_ids
        const rooms = await RoomModel.find({ _id: { $in: roomIds } });

        // Create a mapping for users and rooms for easy lookup
        const userMap = {};
        users.forEach(user => {
            userMap[user._id] = user;
        });

        const roomMap = {};
        rooms.forEach(room => {
            roomMap[room._id] = room;
        });

        // Combine reservation details with user and room details
        const detailedReservations = reservations.map(reservation => ({
            ...reservation.toObject(), // Convert mongoose document to plain object
            user: userMap[reservation.user_id], // Add user details
            room: roomMap[reservation.room_id], // Add room details
        }));

        return res.status(200).json(detailedReservations); // Sending combined details
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // Handle errors properly
    }
};

exports.handleCancellationss= async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Reservation ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await ReservationModel.updateOne(
            { _id: id }, 
            { $set: { status: "cancelled" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Booking not found or status already set to cancelled.");
        }

        return res.status(200).json("Reservation Cancelled successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
};

exports.user__booking= async (req, res) => {
 
    try {
      const reservationId = req.params.id;
      
  
      // Fetch the reservation based on ID
      const reservation = await ReservationModel.findById(reservationId);
  
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
  
      // Fetch room details using room_id from the reservation
      const room = await RoomModel.findById(reservation.room_id);
  
      // Fetch guest details using the array of guest ids
      const guests = await RoomGuestModel.find({ _id: { $in: reservation.guestids } });
      const bill = await BillModel.findOne({ reservationid: reservationId });
      // Combine all data into a single response object
      const response = {
        reservation,
        room,
        guests,
        bill,
      };
  
      res.json(response);
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.user_bookings_cancelss=async (req, res) => {
    try {
      const bookingId = req.params.id; // Get booking ID directly
   // Get booking ID from request parameters
      console.log(bookingId)
      // Check if booking exists
      const booking = await ReservationModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Check the check-in date to see if cancellation is allowed
      const checkInDate = new Date(booking.check_in);
      const currentDate = new Date();
      const daysDiff = (checkInDate - currentDate) / (1000 * 60 * 60 * 24); // Difference in days
  
      if (daysDiff <= 2) {
        return res.status(400).json({ message: 'No refund is available if cancelled within 2 days of the check-in date.' });
      }
  
      // Proceed with cancellation
      booking.status = 'Cancelled'; // Update the booking status
      booking.cancel_date = currentDate; // Set the cancel_date to the current date and time
      await booking.save();
  
      const user = await GoogleRegisterModel.findById(booking.user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found for the booking.' });
      }
  
      // Set up the transporter for nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use any email service
        auth: {
          user: process.env.email_id, // Replace with your email
          pass: process.env.password, // Replace with your email password or an app-specific password
        },
      });
  
      // Create the email options
      const mailOptions = {
        from: process.env.email_id, // Sender address
        to: user.email, // The email of the user to notify
        subject: 'Booking Cancellation Confirmation',
        text: `Dear ${user.displayName},
  
  Your booking with ID ${bookingId} has been successfully cancelled.
  
  Cancellation Date: ${currentDate.toLocaleDateString()}
  Check-in Date: ${checkInDate.toLocaleDateString()}
  
  If you have any questions, feel free to contact our support team.
  
  Thank you,
  Your IntelliStay Hotel Team`,
      };
  
      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending cancellation email:', error);
          return res.status(500).json({ message: 'Booking cancelled, but error in sending email.' });
        } else {
          console.log('Cancellation email sent: ' + info.response);
          return res.status(200).json({ message: 'Booking has been cancelled successfully, and a notification email has been sent to the user.' });
        }
      });
      // return res.status(200).json({ message: 'Booking has been cancelled successfully.' });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  };
  
  const stge = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/proofdocs');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Save file with a timestamp to avoid conflicts
    },
  });
  
  const load = multer({ storage: stge });
  
  // Update guest proof document
  exports.user_guests_proofupdatess=load.single('proofDocument'),async (req, res) => {
      try {
        console.log(req.file)
        const guestId = req.params.id;
        const guest = await RoomGuestModel.findById(guestId);
  
        if (!guest) {
          return res.status(404).json({ success: false, message: 'Guest not found' });
        }
  
        // Check if check-in time is already set
        if (ReservationModel.check_in_time) {
          return res.status(400).json({ success: false, message: 'Cannot update document after check-in' });
        }
     console.log(req.file.filename)
        // Update proofDocument field with new file name
        guest.proofDocument = req.file.filename;
        await guest.save();
  
        res.status(200).json({ success: true, message: 'Document updated successfully' });
      } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    };
  
    exports.leave_applicationss= async (req, res) => {
        try {
            // Step 1: Fetch all leave applications
            const applications = await LeaveApplicationModel.find();
    
            // Step 2: Fetch staff IDs from the applications
            const staffIds = applications.map(application => application.staff_id);
    
            // Step 3: Fetch staff details based on the staff IDs
            const staffDetails = await StaffModel.find({ _id: { $in: staffIds } });
    
            // Create a mapping of staff details for easy access
            const staffMap = {};
            staffDetails.forEach(staff => {
                staffMap[staff._id] = {
                    name: staff.displayName,
                    email: staff.email,
                    role: staff.role,
                };
            });
    
            // Step 4: Combine leave applications with staff details
            const combinedResults = applications.map(application => ({
                ...application.toObject(),
                ...staffMap[application.staff_id] || {},
            }));
    
            // Step 5: Send the combined results as a response
            res.json(combinedResults);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    // Accept leave application
  exports.leave_applications_accept= async (req, res) => {
    try {
      const application = await LeaveApplicationModel.findByIdAndUpdate(req.params.id, { status: 'Accepted', approvedon: new Date() }, { new: true });
      res.json(application);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Reject leave application
  exports.leave_applications_reject= async (req, res) => {
    try {
      const application = await LeaveApplicationModel.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
      res.json(application);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.today= async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Start of the day
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999); // End of the day

        // Fetch attendance records for today
        const attendance = await AttendanceModel.find({ 
            date: { $gte: startOfDay, $lte: endOfDay }, 
            present: true 
        });

        // Extract staff IDs from attendance records
        const staffIds = attendance.map(att => att.staffId);

        // Fetch staff details based on the extracted staff IDs
        const staffDetails = await StaffModel.find({ _id: { $in: staffIds } });

        // Map attendance records to include staff details
        const response = attendance.map(att => {
            const staff = staffDetails.find(s => s._id.toString() === att.staffId); // Find the matching staff
            return {
                _id: staff._id,
                staffName: staff.displayName,
                staffEmail: staff.email,
                staffRole: staff.role,
                staffPhone: staff.phone_no,
                staffImage: staff.image,
                staffAvailability: staff.availability
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

exports.checkJobs= async (req, res) => {
    const { role } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of the day
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day

    try {
        let assignments;

        // Check the appropriate model based on the role
        if (role === 'housekeeping') {
            assignments = await HousekeepingJobModel.find({
                task_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else if (role === 'maintenance') {
            assignments = await MaintenanceJobModel.find({
                task_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // If assignments exist, jobs are assigned
        res.json({ jobsAssigned: assignments.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.assign= async (req, res) => {
    const assignments = req.body; // Expecting an array of { staffId, task, role }
  
    try {
        // Fetch all rooms from the database
        const allRooms = await RoomModel.find({});
        const totalRooms = allRooms.length;
        
        if (totalRooms === 0) {
            return res.status(400).json({ message: 'No rooms available for assignment' });
        }
  
        const totalStaff = assignments.length;
        const roomsPerStaff = Math.floor(totalRooms / totalStaff); // Calculate how many rooms each staff will handle
        const remainingRooms = totalRooms % totalStaff; // Rooms that don't divide evenly among staff
  
        let roomIndex = 0; // This will track the current room being assigned
  
        for (let i = 0; i < totalStaff; i++) {
            const { staffId, task, role } = assignments[i];
            let JobModel;
  
            // Determine the model to use based on the role
            if (role.toLowerCase() === 'housekeeping') {
                JobModel = HousekeepingJobModel;
            } else if (role.toLowerCase() === 'maintenance') {
                JobModel = MaintenanceJobModel;
            } else {
                return res.status(400).json({ message: 'Unknown role type' });
            }
  
            // Calculate the number of rooms for this staff (roomsPerStaff + 1 for the first `remainingRooms` staff)
            const numRoomsToAssign = roomsPerStaff + (i < remainingRooms ? 1 : 0);
  
            // Assign the calculated number of rooms to the current staff
            const assignedRooms = allRooms.slice(roomIndex, roomIndex + numRoomsToAssign);
            if (assignedRooms.length === 0) {
                return res.status(400).json({ message: 'No rooms available for assignment' });
            }
  
            for (const room of assignedRooms) {
                await JobModel.create({
                    staff_id: staffId,
                    room_id: room._id,
                    task_description: task,
                    task_date: new Date(),
                    status: 'assigned', // Set initial status
                });
            }
  
            // Move the roomIndex forward by the number of rooms just assigned
            roomIndex += numRoomsToAssign;
        }
  
        res.status(200).json({ message: 'Jobs assigned successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning jobs', error: error.message });
    }
  };

  const generatePassword = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_';
    let password = '';
    
    // Generate password until it meets the conditions
    while (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[a-zA-Z\d!@#$%^&*()_+[\]{}|;:,.<>?]{6,50}$/.test(password)) {
        password = '';
        for (let i = 0; i < 10; i++) { // Generate a password of 10 characters
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }
    }
    return password;
  };
  
  
  // Function to send a confirmation email
  const sendConfirmationEmail = async (email, displayName, password,role) => {
    // Create a transporter object using your SMTP settings
    const transporter = nodemailer.createTransport({
        service: 'gmail', // For example, using Gmail
        auth: {
            user: process.env.email_id, // Your email address
            pass: process.env.password, // Your email password or app password
        },
    });
  
    const mailOptions = {
        from: process.env.email_id,
        to: email,
        subject: 'Account Confirmation',
        text: `Hello ${displayName},\n\nYour account has been created successfully!\n\nEmail: ${email}\nRole: ${role}\nPassword: ${password}\n\nPlease keep this information safe.\n\nBest regards,\nIntelliSttay`,
    };
  
    return transporter.sendMail(mailOptions);
  };
  

  exports.staffregister= async (req, res) => {
  
    const { email, displayName, phone_no, role, address, dob, salary } = req.body;
    try {
        let staff = await StaffModel.findOne({ email: email });
        
        if (!staff) {
          
            // Generate a unique password that meets the regex requirements
            const password = generatePassword();
            
  
            staff = new StaffModel({
                displayName: displayName,
                phone_no: phone_no,
                role: role,
                address: address,
                dob: dob,
                salary: salary,
                email: email,
                password: password, // Use the generated password
            });
  
            await staff.save();
  
            // Send confirmation email
            await sendConfirmationEmail(email, displayName, password,role);
  
            return res.status(200).json({ message: "Staff registered successfully" });
        } else {
            return res.json("exists");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
  };


  exports.uploadBulkStaffData= async (req, res) => {
    try {
        const staffs = req.body; // Array of staff objects

        // Check if the staff data is valid
        if (!Array.isArray(staffs) || staffs.some(staff => typeof staff !== 'object')) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const validationErrors = [];
        const newStaffs = [];

        for (const staffData of staffs) {
            const { email, displayName, phone_no, role, address, dob, salary } = staffData;

            // Check if staff with the same email already exists
            let staff = await StaffModel.findOne({ email });

            if (!staff) {
                // Generate a unique password for the new staff
                const password = generatePassword(); // 16-character password

                newStaffs.push({
                    displayName,
                    phone_no,
                    role,
                    address,
                    dob,
                    salary,
                    email,
                    password, // Use the generated password
                });
                await sendConfirmationEmail(email, displayName, password,role);
            } else {
                validationErrors.push({ email, message: 'Staff already exists' });
            }
        }

        if (newStaffs.length > 0) {
            // Insert only new staff members into the database
            await StaffModel.insertMany(newStaffs);
        }

        if (validationErrors.length > 0) {
            return res.status(200).json({
                message: 'Bulk upload completed with some errors',
                errors: validationErrors
            });
        }

        return res.status(200).json({ message: 'Bulk staff details uploaded successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

  
exports.totalUsers= async (req, res) => {
  
    try {
      const userCount = await GoogleRegisterModel.countDocuments();
      // Replace with your actual model
      res.status(200).json({ count: userCount });
    } catch (error) {
      console.error("Error fetching user count:", error);
      res.status(500).json({ message: 'An error occurred while fetching user count.' });
    }
  };

  exports.todayLeaveCount= async (req, res) => {
    console.log("Fetching today's leave count...");
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
      // Fetch staff on leave today
      const leaveToday = await LeaveApplicationModel.find({
        startDate: { $lte: endOfDay }, // Leave starts on or before the end of today
        endDate: { $gte: startOfDay }   // Leave ends on or after the start of today
      });
  
      const leaveCount = leaveToday.length; // Count of staff on leave today
      console.log("Today's leave count:", leaveCount);
      res.status(200).json({ count: leaveCount, staff: leaveToday });
    } catch (error) {
      console.error("Error fetching today's leave count:", error);
      res.status(500).json({ message: 'An error occurred while fetching leave count.' });
    }
  };

  const getStartAndEndOfDay = (date) => {
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));
    return { start, end };
  };
  
  // Fetch today's attendance for all staff
  exports.attendance_today= async (req, res) => {
    const today = new Date();
    const { start, end } = getStartAndEndOfDay(today);
  
    try {
      // Find attendance entries where the date is between start and end of today
      const todaysAttendance = await AttendanceModel.find({
        date: {
          $gte: start,
          $lte: end,
        },
      });
      res.json(todaysAttendance);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  };

  exports.attendance_mark= async (req, res) => {
    const attendanceData = req.body;
    console.log(attendanceData) // { staffId: true/false }
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of the day for the date comparison
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day for the date comparison

    try {
        // Loop through each staff's attendance status
        for (const [staffId, isPresent] of Object.entries(attendanceData)) {
            await AttendanceModel.findOneAndUpdate(
                { 
                    staffId, 
                    date: { $gte: startOfDay, $lte: endOfDay } // Ensure the query checks for today's date
                },
                { 
                    staffId, 
                    date: new Date(), 
                    present: isPresent  // Update based on the value of isPresent
                },
                { upsert: true, new: true } // Use upsert to create the document if it doesn't exist
            );
        }
        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

exports.getRestaurantOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
        .sort({ orderDate: -1 }) // Sort by newest first
        .populate('user', 'displayName email') // Updated to match your user model fields
        .populate('items.menuItem', 'name price');

    if (!orders) {
        return res.status(404).json({ message: 'No orders found' });
    }

    return res.status(200).json(orders);
} catch (error) {
    console.error('Error fetching restaurant orders:', error);
    return res.status(500).json({ 
        message: 'Error fetching restaurant orders',
        error: error.message 
    });
}
};


exports.updateOrderStatus = async (req, res) => {
  try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
          return res.status(400).json({
              message: 'Invalid status provided'
          });
      }

      // Find and update the order
      const order = await Order.findById(orderId);

      if (!order) {
          return res.status(404).json({
              message: 'Order not found'
          });
      }

      // Update status
      order.status = status;
      await order.save();

      // Return updated order
      const updatedOrder = await Order.findById(orderId)
          .populate('user', 'displayName email')
          .populate('items.menuItem', 'name price');

      return res.status(200).json({
          message: 'Order status updated successfully',
          order: updatedOrder
      });

  } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({
          message: 'Error updating order status',
          error: error.message
      });
  }
};

exports.getReservations = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
          return res.status(400).json({
              message: 'Start date and end date are required'
          });
      }

      // Find reservations within date range
      const reservations = await TableReservationModel.find({
          reservationDate: {
              $gte: new Date(startDate),
              $lt: new Date(endDate)
          }
      })
      .sort({ reservationDate: 1 })
      .populate('user', 'displayName email phoneNumber');

      return res.status(200).json(reservations);

  } catch (error) {
      console.error('Error fetching reservations:', error);
      return res.status(500).json({
          message: 'Error fetching reservations',
          error: error.message
      });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
      const { reservationId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
          return res.status(400).json({
              message: 'Invalid status provided'
          });
      }

      const reservation = await TableReservationModel.findByIdAndUpdate(
          reservationId,
          { status },
          { new: true }
      ).populate('user', 'displayName email phoneNumber');

      if (!reservation) {
          return res.status(404).json({
              message: 'Reservation not found'
          });
      }

      return res.status(200).json({
          message: 'Reservation status updated successfully',
          reservation
      });

  } catch (error) {
      console.error('Error updating reservation status:', error);
      return res.status(500).json({
          message: 'Error updating reservation status',
          error: error.message
      });
  }
};


exports.getDashboardStats = async (req, res) => {
  try {
    // Get room statistics
    const rooms = await RoomModel.find();
    const reservations = await ReservationModel.find();
    const staff = await StaffModel.find();
    const orders = await Order.find();
    const maintenanceJobs = await MaintenanceJobModel.find();
    const housekeepingJobs = await HousekeepingJobModel.find();
    const attendance = await AttendanceModel.find();
    const bills = await BillModel.find();

    // Calculate room stats
    const roomStats = {
      totalRooms: rooms.length,
      occupiedRooms: rooms.filter(room => room.status === 'occupied').length,
      availableRooms: rooms.filter(room => room.status === 'available').length,
      maintenanceRooms: rooms.filter(room => room.status === 'maintenance').length,
      occupancyRate: ((rooms.filter(room => room.status === 'occupied').length / rooms.length) * 100).toFixed(1)
    };

    // Calculate financial stats
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const monthlyRevenue = bills
      .filter(bill => {
        const billDate = new Date(bill.orderDate);
        return billDate.getMonth() === thisMonth && billDate.getFullYear() === thisYear;
      })
      .reduce((total, bill) => total + bill.totalRate, 0);

    // Calculate staff stats
    const staffStats = {
      totalStaff: staff.length,
      onDuty: attendance.filter(a => a.present && new Date(a.date).toDateString() === today.toDateString()).length,
      onLeave: staff.length - attendance.filter(a => a.present && new Date(a.date).toDateString() === today.toDateString()).length,
      attendanceRate: ((attendance.filter(a => a.present).length / attendance.length) * 100).toFixed(1)
    };

    // Calculate restaurant stats
    const restaurantStats = {
      dailyOrders: orders.filter(order => new Date(order.orderDate).toDateString() === today.toDateString()).length,
      todayRevenue: orders
        .filter(order => new Date(order.orderDate).toDateString() === today.toDateString())
        .reduce((total, order) => total + order.totalAmount, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      popularItems: await getPopularMenuItems()
    };

    // Calculate maintenance stats
    const maintenanceStats = {
      pendingTasks: maintenanceJobs.filter(job => job.status === 'pending').length + 
                   housekeepingJobs.filter(job => job.status === 'pending').length,
      roomsToClean: housekeepingJobs.filter(job => job.status === 'pending').length,
      maintenanceRequests: maintenanceJobs.filter(job => job.status === 'pending').length,
      completedToday: maintenanceJobs.filter(job => 
        job.status === 'completed' && 
        new Date(job.completedAt).toDateString() === today.toDateString()
      ).length
    };

    console.log({
        roomStats,
        financialStats: {
          totalRevenue: monthlyRevenue,
          revenueData: await getRevenueData()
        },
        staffStats,
        restaurantStats,
        maintenanceStats,
        guestStats: {
          currentGuests: await getCurrentGuestsCount(),
          guestTrend: await calculateGuestTrend()
        }
      });
      
    res.json({
      roomStats,
      financialStats: {
        totalRevenue: monthlyRevenue,
        revenueData: await getRevenueData()
      },
      staffStats,
      restaurantStats,
      maintenanceStats,
      guestStats: {
        currentGuests: await getCurrentGuestsCount(),
        guestTrend: await calculateGuestTrend()
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
}

// Helper functions
const getPopularMenuItems = async () => {
  const orders = await Order.find()
    .populate('items.menuItem')
    .limit(100);
  
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.menuItem.name] = (itemCounts[item.menuItem.name] || 0) + item.quantity;
    });
  });

  return Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);
};

const getCurrentGuestsCount = async () => {
  const activeReservations = await ReservationModel.find({
    status: 'checked-in'
  });
  return activeReservations.length;
};

const calculateGuestTrend = async () => {
  // Calculate guest trend compared to last week
  // Implementation details...
  return 5; // Placeholder
};

const getRevenueData = async () => {
  // Get revenue data for the last 30 days
  // Implementation details...
  return []; // Placeholder
};



// exports.getDashboardStats = async (req, res) => {
//     try {
//         // Get current date and time ranges
//         const today = new Date();
//         const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//         const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//         const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//         const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         const startOfWeek = new Date(today);
//         startOfWeek.setDate(today.getDate() - today.getDay());

//         // Hotel Statistics
//         const hotelStats = await Promise.all([
//             // Room statistics with detailed status
//             RoomModel.aggregate([
//                 {
//                     $group: {
//                         _id: "$status",
//                         count: { $sum: 1 },
//                         rooms: { $push: "$$ROOT" }
//                     }
//                 }
//             ]),

//             // Revenue statistics with daily breakdown
//             BillModel.aggregate([
//                 {
//                     $match: {
//                         createdAt: { $gte: startOfMonth, $lte: endOfMonth },
//                         status: "Confirmed" // Only count paid bills
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: {
//                             $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
//                         },
//                         dailyRevenue: { $sum: "$totalRate" },
//                         count: { $sum: 1 }
//                     }
//                 },
//                 {
//                     $sort: { "_id": 1 }
//                 }
//             ]),

//             // Current occupancy with detailed room info
//             ReservationModel.aggregate([
//                 {
//                     $match: {
//                         checkInDate: { $lte: today },
//                         checkOutDate: { $gte: today },
//                         status: { $in: ["confirmed", "checked-in"] }
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "rooms",
//                         localField: "room_id",
//                         foreignField: "_id",
//                         as: "roomDetails"
//                     }
//                 }
//             ]),

//             // Popular room types with revenue data
//             ReservationModel.aggregate([
//                 {
//                     $match: {
//                         createdAt: { $gte: startOfMonth },
//                         status: { $in: ["confirmed", "checked-in", "completed"] }
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "rooms",
//                         localField: "room_id",
//                         foreignField: "_id",
//                         as: "room"
//                     }
//                 },
//                 { $unwind: "$room" },
//                 {
//                     $group: {
//                         _id: "$room.type",
//                         count: { $sum: 1 },
//                         revenue: { $sum: "$totalAmount" },
//                         averageRate: { $avg: "$totalAmount" }
//                     }
//                 },
//                 { $sort: { count: -1 } },
//                 { $limit: 5 }
//             ])
//         ]);

//         // Restaurant Statistics
//         const restaurantStats = await Promise.all([
//             // Today's orders with status breakdown
//             Order.aggregate([
//                 {
//                     $match: {
//                         orderDate: { $gte: startOfDay, $lte: endOfDay }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: "$status",
//                         count: { $sum: 1 },
//                         revenue: { $sum: "$totalAmount" }
//                     }
//                 }
//             ]),

//             // Monthly revenue with daily breakdown
//             Order.aggregate([
//                 {
//                     $match: {
//                         createdAt: { $gte: startOfMonth },
//                         status: "completed"
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: {
//                             $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
//                         },
//                         revenue: { $sum: "$totalAmount" },
//                         orderCount: { $sum: 1 }
//                     }
//                 },
//                 { $sort: { "_id": 1 } }
//             ]),

//             // Popular dishes with revenue data
//             Order.aggregate([
//                 {
//                     $match: {
//                         createdAt: { $gte: startOfMonth },
//                         status: "completed"
//                     }
//                 },
//                 { $unwind: "$items" },
//                 {
//                     $group: {
//                         _id: "$items.menuItem",
//                         count: { $sum: 1 },
//                         revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "menuitems",
//                         localField: "_id",
//                         foreignField: "_id",
//                         as: "menuItem"
//                     }
//                 },
//                 { $unwind: "$menuItem" },
//                 {
//                     $project: {
//                         name: "$menuItem.name",
//                         count: 1,
//                         revenue: 1,
//                         averageOrderValue: { $divide: ["$revenue", "$count"] }
//                     }
//                 },
//                 { $sort: { count: -1 } },
//                 { $limit: 5 }
//             ]),

//             // Table utilization with detailed metrics
//             TableReservationModel.aggregate([
//                 {
//                     $match: {
//                         reservationDate: { $gte: startOfWeek }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: "$table_id",
//                         reservationCount: { $sum: 1 },
//                         totalGuests: { $sum: "$numberOfGuests" },
//                         averagePartySize: { $avg: "$numberOfGuests" }
//                     }
//                 }
//             ])
//         ]);

//         // Format and transform the data
//         const [roomStatus, revenueData, currentOccupancy, popularRooms] = hotelStats;
//         const [todayOrders, monthlyOrders, popularDishes, tableUtilization] = restaurantStats;

//         // Calculate total rooms for occupancy rate
//         const totalRooms = roomStatus.reduce((sum, status) => sum + status.count, 0);

//         // Transform revenue data for charts
//         const transformedRevenueData = revenueData.map(day => ({
//             x: day._id,
//             y: day.dailyRevenue
//         }));

//         return res.status(200).json({
//             success: true,
//             hotelMetrics: {
//                 roomStatus: roomStatus.reduce((acc, curr) => ({
//                     ...acc,
//                     [curr._id]: {
//                         count: curr.count,
//                         percentage: (curr.count / totalRooms) * 100
//                     }
//                 }), {}),
//                 revenueData: [{
//                     id: 'revenue',
//                     data: transformedRevenueData
//                 }],
//                 occupancyRate: (currentOccupancy.length / totalRooms) * 100,
//                 popularRoomTypes: popularRooms.map(room => ({
//                     type: room._id,
//                     bookings: room.count,
//                     revenue: room.revenue,
//                     averageRate: room.averageRate
//                 }))
//             },
//             restaurantMetrics: {
//                 todayOrders: {
//                     total: todayOrders.reduce((sum, status) => sum + status.count, 0),
//                     byStatus: todayOrders.reduce((acc, curr) => ({
//                         ...acc,
//                         [curr._id]: curr.count
//                     }), {})
//                 },
//                 revenueData: [{
//                     id: 'revenue',
//                     data: monthlyOrders.map(day => ({
//                         x: day._id,
//                         y: day.revenue
//                     }))
//                 }],
//                 popularDishes: popularDishes.map(dish => ({
//                     name: dish.name,
//                     count: dish.count,
//                     revenue: dish.revenue,
//                     averageOrderValue: dish.averageOrderValue
//                 })),
//                 tableUtilization: tableUtilization.map(table => ({
//                     tableId: table._id,
//                     utilizationRate: (table.reservationCount / 7) * 100,
//                     totalGuests: table.totalGuests,
//                     averagePartySize: table.averagePartySize
//                 }))
//             },
//             timestamp: new Date()
//         });

//     } catch (error) {
//         console.error("Error fetching dashboard stats:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Error fetching dashboard statistics",
//             error: error.message
//         });
//     }
// };