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
const { MenuItem, Table, Order, TableReservation } = require('../models/RestaurantModel');
const TableReservationModel=require('../models/TableReservation')



exports.stafflogin= (req, res) => {
    const { emailsign, passwordsign } = req.body;
    StaffModel.findOne({ email: emailsign })
        .then(user => {
            if (user) {
                if (user.password === passwordsign) {
                    console.log(user._id)
                    console.log(user.image)
                    const token = jwt.sign({displayName:user.displayName,email:user.email,role:user.role,_id:user._id,image:user.image}, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",token: token});
                    
                } else {
                    res.json({message:"the password is incorrect"});
                }
            } else {
                res.json({message:"No user found :("});
            }
        })
        .catch(err => res.json(err));
};

//staff otp

const transporterr = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.email_id,
          pass: process.env.password,
        },
      });

      exports.send_otp= async (req, res) => {
        const { email } = req.body;
        const user = await StaffModel.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
      
        // Generate a random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
        // Save OTP in the user model or in a temporary database with expiration
        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // 1 hour expiry
        await user.save();
      
        // Send OTP via email
        const mailOptions = {
          from: process.env.email_id,
          to: email,
          subject: 'Password Reset OTP',
          text: `Your OTP is: ${otp}`,
        };
      
        transporterr.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(500).json({ message: 'Error sending email' });
          }
          res.status(200).json({ message: 'OTP sent to email' });
        });
      };
      
      //otp verify

      exports.staff_verify= async (req, res) => {
        const { email, otp } = req.body;
        console.log(req.body)
        const user = await StaffModel.findOne({ email });
        console.log(user)
        console.log(user.otp)
        console.log(user.otpExpires)
        if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
          return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
      
        // Generate token to allow password reset
        const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
        res.status(200).json({ message: 'OTP verified', token });
      };

      //reset password

      exports.staff_reset_password= async (req, res) => {
        const { token, password } = req.body;
        console.log(password)
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
          console.log(decoded.email)
          const user = await StaffModel.findOne({ email: decoded.email });
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          else{
          // Hash the new password and save
        //   const hashedPassword = await bcrypt.hash(newPassword, 10);
          user.password = password;
          await user.save();
      
          res.status(200).json({ message: 'Password reset successful' });
          }
        } catch (error) {
          res.status(400).json({ message: 'Invalid token or expired token' });
        }
      };

      //apply leave


      exports.applyleave= async (req, res) => {
        try {
            const { staff_id, leaveType, startDate, endDate, reason } = req.body;
            console.log(req.body);
    
            // Parse startDate and endDate into Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);
            console.log(start);
    
            // Calculate the number of days for the leave application
            const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
            // Check if the number of days applied for exceeds 5 days
            if (leaveDays > 5) {
                console.log(leaveDays);
                return res.status(200).json({ message: "You cannot apply for more than 5 days leave at a time." });
            }
    
            // Get current year for leave count checks
            const currentYear = new Date().getFullYear();
            console.log(currentYear)
            // Check if the staff has already taken 15 casual leaves this year
            if (leaveType === 'Casual Leave') {
                const casualLeaveTaken = await LeaveApplicationModel.countDocuments({
                    staff_id,
                    leaveType: 'Casual Leave',
                    startDate: {
                        $gte: new Date(`${currentYear}-01-01T00:00:00.000+00:00`),
                        $lt: new Date(`${currentYear}-12-31T23:59:59.999+00:00`)
                    }
                });
    
                if (casualLeaveTaken >= 15) {
                    console.log(casualLeaveTaken)
                    return res.status(200).json({ message: "You have already taken the maximum 15 Casual Leaves this year." });
                }
            }
    
            // Check if the staff has already taken 2 sick (medical) leaves this year
            if (leaveType === 'Sick Leave') {
                const medicalLeaveTaken = await LeaveApplicationModel.countDocuments({
                    staff_id,
                    leaveType: 'Sick Leave',
                    startDate: {
                        $gte: new Date(`${currentYear}-01-01T00:00:00.000+00:00`),
                        $lt: new Date(`${currentYear}-12-31T23:59:59.999+00:00`)
                    }
                });
    
                if (medicalLeaveTaken >= 2) {
                    return res.status(200).json({ message: "You have already taken the maximum 2 Sick Leaves this year." });
                }
            }
    
            // Check if a leave application already exists for the given dates
            const existingApplication = await LeaveApplicationModel.findOne({
                staff_id,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });
    
            if (existingApplication) {
                return res.status(200).json({message:"Leave already taken on these days "});
            }
    
            // Create a new leave application
            const newLeaveApplication = new LeaveApplicationModel({
                staff_id,
                leaveType,
                startDate: new Date(startDate),  // ensure consistent Date format
                endDate: new Date(endDate),      // ensure consistent Date format
                reason,
                status: 'Pending',
                appliedon: new Date()
            });
    
            await newLeaveApplication.save();
            res.status(201).json(newLeaveApplication);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error', error });
        }
    };

    //today reservation

    exports.reservations_todays_reservations= async (req, res) => {
        try {
          const today = new Date();
          
          // Find reservations for today
          const reservations = await ReservationModel.find({
            check_in: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999)),
            },
          });
      
          // Prepare to store enriched reservation details
          const enrichedReservations = [];
      
          for (const reservation of reservations) {
            // Get guest name from GoogleSignModel using user_id
            const guest = await GoogleRegisterModel.findById(reservation.user_id);
            const guestName = guest ? guest.displayName : "Unknown";
            const guestemail=guest? guest.email : "unknown";
            const guestphno=guest? guest.phone_no : "unknown";
            // Get room number from RoomModel using room_id
            const room = await RoomModel.findById(reservation.room_id);
            const roomNumber = room ? room.roomno : "Unknown";
            
            // Add reservation data with guest name and room number
            enrichedReservations.push({
              _id: reservation._id,
              guestName,
              roomNumber,
              guestemail,
              guestphno,
              checkInDate: reservation.check_in,
              checkOutDate: reservation.check_out,
              check_in_time: reservation.check_in_time,
              status: reservation.status,
            });
          }
      
          // Send enriched reservation details
          res.json(enrichedReservations);
      
        } catch (error) {
          console.error("Error fetching today's reservations", error);
          res.status(500).json({ error: "Error fetching today's reservations." });
        }
      };


      // Verify reservation
  exports.reservations_verify= async (req, res) => {
    try {
      const reservation = await ReservationModel.findById(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
  
      reservation.is_verified = "yes"; // Update status to verified
      await reservation.save();
      res.json({ message: "Reservation verified", reservation });
    } catch (error) {
      res.status(500).json({ error: "Error verifying reservation" });
    }
  };
  

    // Check-in reservation
    exports.reservations_checkin= async (req, res) => {
        try {
          const reservation = await ReservationModel.findById(req.params.id);
          if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
          }
      
          if (reservation.is_verified !== "yes") {
            return res.status(400).json({ error: "Reservation must be verified first" });
          }
      
          reservation.check_in_time = new Date(); // Set current time as check-in time
          reservation.status = "checked_in"; // Mark reservation as checked-in
          await reservation.save();
          res.json({ message: "Check-in completed", reservation });
        } catch (error) {
          res.status(500).json({ error: "Error checking in reservation" });
        }
      };
    
      //checkout 

      exports.reservations_todays_checkouts= async (req, res) => {
        try {
          const today = new Date();
          const reservations = await ReservationModel.find({
            check_out: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999)),
            },
          });
      
          const enrichedReservations = [];
      
          for (const reservation of reservations) {
            const guest = await GoogleRegisterModel.findById(reservation.user_id);
            const room = await RoomModel.findById(reservation.room_id);
      
            enrichedReservations.push({
              _id: reservation._id,
              guestName: guest ? guest.displayName : "Unknown",
              guestEmail: guest ? guest.email : "Unknown",
              guestPhone: guest ? guest.phone_no : "Unknown",
              roomNumber: room ? room.roomno : "Unknown",
              checkOutDate: reservation.check_out,
              status: reservation.status,
              checkoutTime: reservation.check_out_time || null,
            });
          }
      
          res.json(enrichedReservations);
        } catch (error) {
          console.error("Error fetching today's checkouts", error);
          res.status(500).json({ error: "Error fetching today's checkouts." });
        }
      };

      //checkout 
      exports.reservations_checkout= async (req, res) => {
        try {
          const reservation = await ReservationModel.findByIdAndUpdate(
            req.params.reservationId,
            {
              status: "checked_out",
              check_out_time: new Date(),
            },
            { new: true }
          );
          res.json({ message: "Checkout completed successfully" });
        } catch (error) {
          res.status(500).json({ error: "Error during checkout." });
        }
      };
    
      //reservtion confirm

      // Configure Cloudinary storage for staff profile pictures
      const profileStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'staffprofilepicture',
          allowed_formats: ['jpg', 'jpeg', 'png'],
          transformation: [{ width: 500, height: 500, crop: 'limit' }]
        }
      });

      // Configure Cloudinary storage for cleaned room photos
      const cleanedRoomStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'cleanedrooms',
          allowed_formats: ['jpg', 'jpeg', 'png'],
          resource_type: 'image'
        }
      });

      // Configure Cloudinary storage for proof documents
      const proofDocStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'proofdocs',
          allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
          resource_type: 'auto'
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


      const uploadmenuImages = multer({ 
        storage: menuImageStorage,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
      });


      // Initialize multer with Cloudinary storage
      const uploadProfilePhoto = multer({ storage: profileStorage });
      const uploadCleanedRoomPhotos = multer({ storage: cleanedRoomStorage });
      const uploadProofDocs = multer({ storage: proofDocStorage });

      // Update staff profile photo handler
      exports.staff_upload_photo = [
        uploadProfilePhoto.single('image'),
        async (req, res) => {
          try {
            const userId = req.params.id;
            
            if (!req.file) {
              return res.status(400).json({ message: 'No file uploaded' });
            }

            // Get Cloudinary URL from uploaded file
            const imageUrl = req.file.path;

            // If staff has an existing profile picture, delete it from Cloudinary
            const staff = await StaffModel.findById(userId);
            if (staff.image) {
              try {
                const publicId = staff.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              } catch (error) {
                console.error('Error deleting old profile picture:', error);
              }
            }

            // Update staff profile with new Cloudinary URL
            const updatedStaff = await StaffModel.findByIdAndUpdate(
              userId,
              { image: imageUrl },
              { new: true }
            );

            if (!updatedStaff) {
              return res.status(404).json({ message: 'Staff not found' });
            }

            res.json({ 
              message: 'Profile image updated successfully', 
              image: imageUrl 
            });
          } catch (error) {
            console.error('Error updating profile image:', error);
            res.status(500).json({ 
              message: 'Error updating profile image', 
              error: error.message 
            });
          }
        }
      ];

      // Complete housekeeping job with photos
      exports.completeJob = [
        uploadCleanedRoomPhotos.array('photos', 5),
        async (req, res) => {
          const { jobId, maintenanceRequired } = req.body;

          try {
            const job = await HousekeepingJobModel.findById(jobId);
            if (!job) {
              return res.status(404).json({ message: 'Job not found' });
            }

            // Get Cloudinary URLs from uploaded files
            const photoUrls = req.files.map(file => file.path);

            // If job has existing photos, delete them from Cloudinary
            if (job.photos && job.photos.length > 0) {
              try {
                for (const photoUrl of job.photos) {
                  const publicId = photoUrl.split('/').pop().split('.')[0];
                  await cloudinary.uploader.destroy(publicId);
                }
              } catch (error) {
                console.error('Error deleting old photos:', error);
              }
            }

            // Update job with new photo URLs
            job.photos = photoUrls;
            job.status = 'cleaning completed';
            job.maintenanceRequired = maintenanceRequired;
            job.completedAt = new Date();
            await job.save();

            res.status(200).json({ 
              message: 'Job completed successfully',
              photos: photoUrls
            });
          } catch (error) {
            console.error('Error completing job:', error);
            res.status(500).json({ 
              message: 'Error completing job', 
              error: error.message 
            });
          }
        }
      ];

      // Staff booking confirmation with proof documents
      exports.staff_confirmbook = [
        uploadProofDocs.array('proofDocuments', 10),
        async (req, res) => {
          try {
            if (!req.files || req.files.length === 0) {
              return res.status(400).json({
                success: false,
                message: 'No proof documents uploaded'
              });
            }

            // Get Cloudinary URLs from uploaded files
            const documentUrls = req.files.map(file => file.path);

            // Your existing booking confirmation logic here
            // Use documentUrls instead of local file paths

            res.status(200).json({ 
              success: true,
              message: 'Booking confirmed successfully', 
              documents: documentUrls 
            });
          } catch (error) {
            console.error('Error confirming booking:', error);
            res.status(500).json({ 
              success: false,
              message: 'Error confirming booking',
              error: error.message 
            });
          }
        }
      ];

      //my profile update
      
      exports.staff_profile_get= async (req, res) => {
        try {
          const staff = await StaffModel.findById(req.params.id);
          if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
          }
          
          res.json(staff);
        } catch (error) {
          res.status(500).json({ message: "Error fetching profile", error });
        }
      };
    
      exports.profile_put= async (req, res) => {
        try {
          const { displayName, email, address, salary,image,phone_no,role,dob } = req.body;
          const staff = await StaffModel.findByIdAndUpdate(
            req.params.id,
            { displayName, email, address, salary,image,phone_no,role,dob },
            { new: true, runValidators: true }
          );
      
          if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
          }
      
          res.json({ message: "Profile updated successfully", staff });
        } catch (error) {
          res.status(500).json({ message: "Error updating profile", error });
        }
      };

      // Change password route
exports.staff_change_password=async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const staff = await StaffModel.findById(req.params.id);
  
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
  
      // Check if current password matches
      if (currentPassword !== staff.password) {
          return res.status(400).json({ message: 'Incorrect current password' });
        }
  
      // Hash new password and update it
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(newPassword, salt);
      staff.password = newPassword;
  
      // Save the updated staff member
      await staff.save();
      res.status(200).json({ message: 'Password updated successfully' });
  
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
    
  //reservation details

  exports.resdetails= async (req, res) => {
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

//handle cancellation

exports.handleCancellation= async (req, res) => {
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

//staff 

// Get available rooms
exports.staff_rooms_available= async (req, res) => {
    const { roomType, checkInDate, checkOutDate, adults, children } = req.query;
  
    try {
      // Validation: Check if adults or children are within reasonable bounds
      if (adults <= 0 || children < 0) {
        return res.status(400).json({ message: 'Invalid number of adults or children' });
      }
  
      // Calculate the number of rooms needed based on 2 adults and 2 children per room
      const totalPeople = parseInt(adults) + parseInt(children);
      const roomsNeeded = Math.ceil(totalPeople / 4); // Each room can accommodate up to 4 people
  
      // Find reserved rooms for the check-in and check-out dates
      const reservedRooms = await ReservationModel.find({
        $or: [
          {
            check_in: { $lt: new Date(checkOutDate) }, 
            check_out: { $gt: new Date(checkInDate) }
          }
        ]
      }).distinct('room_id');
  
      // Find available rooms excluding reserved rooms
      const availableRooms = await RoomModel.find({
        _id: { $nin: reservedRooms },
        roomtype: roomType // Filter by room type if provided
      });
  
      // Check if there are enough available rooms
      if (availableRooms.length < roomsNeeded) {
        return res.status(200).json({ 
          message: 'Not enough available rooms', 
          availableRooms, 
          roomsNeeded, 
          roomsAvailable: availableRooms.length 
        });
      }
  
      // Return available rooms and number of rooms needed
      res.status(200).json({ 
        message: 'Rooms available', 
        availableRooms, 
        roomsNeeded 
      });
  
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      res.status(500).json({ message: 'Failed to fetch available rooms' });
    }
  };

  exports.staff_rooms_types= async (req, res) => {
    try {
      const roomTypes = await RoomModel.distinct('roomtype');
      console.log(roomTypes)
      res.json(roomTypes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch room types' });
    }
  };

 
//post
  exports.pickJob=async (req, res) => {
    const { jobId } = req.body;
    try {
        const job = await HousekeepingJobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        job.status = 'cleaning in progress';
        await job.save();
        res.status(200).json({ message: 'Job picked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error picking job', error });
    }
};


  const storagee = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/cleanedrooms');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const uploadsss = multer({ storage: storagee });



// Complete a job post
exports.completeJob= uploadsss.array('photos', 5) ,async (req, res) => {
    const { jobId, maintenanceRequired } = req.body;
    const files = req.files;

    try {
        const job = await HousekeepingJobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const photoFilenames = files.map(file => file.filename);
        job.photos = photoFilenames;
        job.status = 'cleaning completed';
        job.maintenanceRequired = maintenanceRequired;
        job.completedAt = new Date(); 
        await job.save();

        res.status(200).json({ message: 'Job completed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error completing job', error });
    }
};

//get
exports.jobdetail= async (req, res) => {
    try {
      const jobId = req.params.id;
  
      // Find the job in the database
      const job = await HousekeepingJobModel.findById(jobId);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Fetch the corresponding room details using the room ID from the job
      const room = await RoomModel.findById(job.room_id); // Assuming job has a field named roomId
  
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Construct the response object
      const response = {
        roomno: room.roomno,
        task_description: job.task_description,
        task_date: job.task_date,
        status: job.status,
        photos: job.photos,
        maintenanceRequired: job.maintenanceRequired,
        completedAt: job.completedAt,
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  };



//post
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

//post

exports.leaveDetails=async (req, res) => {
    try {
      const leaves = await LeaveApplicationModel.find({ staff_id: req.params.userId });
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

 // Get leave detail by ID
 exports.leaveDetail=async (req, res) => {
    try {
      const leave = await LeaveApplicationModel.findById(req.params.leaveId);
      if (!leave) return res.status(404).json({ message: "Leave not found" });
      res.json(leave);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
//delete
exports.deleteLeave= async (req, res) => {
    const leaveId = req.params.leaveId;
  
    try {
      const deletedLeave = await LeaveApplicationModel.findByIdAndDelete(leaveId);
      if (!deletedLeave) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      res.json({ message: "Leave request deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };


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
              isAvailable
          } = req.body;

          // Validate required fields
          if (!name || !description || !price || !category) {
              return res.status(400).json({
                  error: 'Missing required fields: name, description, price, and category are required'
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
              isAvailable: isAvailable === 'true'
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

