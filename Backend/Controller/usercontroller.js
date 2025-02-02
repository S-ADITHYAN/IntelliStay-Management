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
const TableReservationModel=require('../models/TableReservation')


const QRCode = require('../models/QRCode');




exports.authlogin=async (req, res) => {
    const { emailsign, passwordsign } = req.body;
    console.log(passwordsign)
    GoogleRegisterModel.findOne({ email: emailsign })
        .then(user => {
            if (user) {
            
                if (user.password && user.password.length > 0 && user.password === passwordsign) {
                    console.log("hello")
                    req.session.email =  emailsign ;
                    const token = jwt.sign({ displayName:user.displayName,email:user.email,_id:user._id,image:user.image }, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",data: req.session.email,id:user._id,token:token,displayName:user.displayName});
                    
                } else {
                    res.json("the password is incorrect");
                }
            } else {
                res.json("No user found :(");
            }
        })
        .catch(err => res.json(err));
};

exports.authwithgoogle=async (req,res)=>{
    
    const {name,  email, password, images} = req.body;
    

    try{
        const existingUser = await GoogleRegisterModel.findOne({ email: email });       

        if(!existingUser){
            const result = await GoogleRegisterModel.create({
                displayName:name,
                email:email,
                password:password,
                image:images,
            
            });

    
            const token = jwt.sign({displayName:result.displayName,email:result.email,_id: result._id}, process.env.JWT_SECRET_KEY);

            return res.status(200).send({
                 user:result,
                 token:token,
                 msg:"User Login Successfully!"
             })
    
        }

        else{
            const existingUser = await GoogleRegisterModel.findOne({ email: email });
            const token = jwt.sign({displayName:existingUser.displayName,email:existingUser.email,_id: existingUser._id}, process.env.JWT_SECRET_KEY);

            return res.status(200).send({
                 user:existingUser,
                 token:token,
                 msg:"User Login Successfully!"
             })
        }
      
    }catch(error){
        console.log(error)
    }

};

exports.authlogout=(req, res) => {
if(req.session){
    req.session.destroy(err=>{
        if(err){
        res.status(500).json({error:"failed to logout"});
        }else{
            res.status(200).json("logout successful");
        }
    })
}
else{
    res.status(400).json({error:"no session found"});
}

};

// Function to generate a random OTP
const otpStore = {};

// Generate OTP function
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    console.log(`Generated OTP: ${otp}`);
    return otp;
};

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email_id,
            pass: process.env.password,
        },
    });

    let mailOptions = {
        from: process.env.email_id,
        to: email,
        subject: 'Your OTP for Registration',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    };

    return transporter.sendMail(mailOptions);
};

// Route to handle registration and OTP generation
exports.register= async (req, res) => {
    console.log("Request Body:", req.body);
    const { email, password, firstname } = req.body;

    try {
        let user = await GoogleRegisterModel.findOne({ email: email });
        console.log(user);
        if (user) {
            return res.status(200).json({ message: "Email already exists." });
        } else {
            // Generate OTP
            const otp = generateOTP();
            console.log('Generated OTP:', otp);

            // Store OTP and password in memory for 10 minutes
            otpStore[email] = { otp, password, expires: Date.now() + 10 * 60 * 1000 }; // expires in 10 minutes

            // Send OTP to the user's email
            await sendOtpEmail(email, otp);

            // Send response with all form data
            return res.status(200).json({
                message: "OTP sent to your email.",
                formdata: { ...req.body },
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};


const sendAccountConfirmationEmail = async (email,firstname) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email_id,
            pass: process.env.password,
        },
    });

    let mailOptions = {
        from: process.env.email_id,
        to: email,
        subject: 'Account Successfully Created',
        text: `Your account has been successfully created! Welcome, ${firstname} to IntelliStay platform.`,
    };

    return transporter.sendMail(mailOptions);
};

exports.verify_otp = async (req, res) => {
    console.log(req.body);
    const { email, otp, firstname } = req.body;

    try {
        // Check if the OTP exists and is still valid
        const storedData = otpStore[email];
        if (!storedData || Date.now() > storedData.expires) {
            delete otpStore[email]; // Clean up expired OTP
            return res.status(400).json({ message: "OTP has expired or is invalid." });
        }
        
        // Check if the OTP matches
        if (otp === storedData.otp) {
            // OTP is correct, save user to the database
            // const salt=await bcrypt.genSalt(10);
            // const hashpass=await bcrypt.hash(storedData.password,salt)
            let user = new GoogleRegisterModel({
                email,
                password: storedData.password, // Ideally, hash this before saving
                displayName: firstname,
            });
            await user.save();

            // Send account creation confirmation email
            await sendAccountConfirmationEmail(email,firstname);

            // Remove OTP from memory after successful registration
            delete otpStore[email];

            return res.status(200).json({ message: "OTP verified. Registration complete." });
        } else {
            return res.status(400).json({ message: "Invalid OTP." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};


//password reset
exports.reset_password= async (req, res) => {
    const { token, password } = req.body;
    console.log(password)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded.email)
      const user = await GoogleRegisterModel.findOne({ email: decoded.email });
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


  // forgot password field
const transporterr = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.email_id,
      pass: process.env.password,
    },
  });
  
  // 1. Request OTP (Send Email)
  exports.send_otp= async (req, res) => {
    const { email } = req.body;
    const user = await GoogleRegisterModel.findOne({ email });
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

  // 2. Verify OTP
  exports.verify= async (req, res) => {
    const { email, otp } = req.body;
    console.log(req.body)
    const user = await GoogleRegisterModel.findOne({ email });
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


  //checkrooms

  exports.checkrooms= async (req, res) => {
    try {
        const { checkInDate, checkOutDate, adults, children } = req.body.searchdata;
        
        // Validation: Check if adults or children are within reasonable bounds
        if (adults <= 0 || children < 0) {
            return res.status(400).json({ message: 'Invalid number of adults or children' });
        }

        // Calculate the number of rooms needed based on 2 adults and 2 children per room
        const totalPeople = adults + children;
        const roomsNeeded = Math.ceil(totalPeople / 4); // Each room can have up to 4 people (2 adults, 2 children)

        // Find reserved rooms for the check-in date
        const reservedRooms = await ReservationModel.find({
            check_in: { $eq: new Date(checkInDate) }
        }).distinct('room_id');
        // console.log('Reserved rooms:', reservedRooms);

        // Find available rooms
        const availableRooms = await RoomModel.find({
            _id: { $nin: reservedRooms }
        });
console.log("avaiable",availableRooms)
        if (availableRooms.length < roomsNeeded) {
            return res.status(200).json({ 
                message: 'Not enough available rooms', 
                availableRooms, 
                roomsNeeded, 
                roomsAvailable: availableRooms.length 
            });
        }

        // Return the available rooms and number of rooms needed
        res.status(200).json({ 
            message: 'Rooms available', 
            availableRooms, 
            roomsNeeded 
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).send('Server Error');
    }
};


//room-details

exports.rooms_details= async (req, res) => {
    try {
      // Fetch distinct available rooms grouped by room type
      const availableRooms = await RoomModel.aggregate([
        {
          $group: {
            _id: "$roomtype", // Group by room_type
            roomDetails: { $first: "$$ROOT" } // Get the first room document for each room_type
          }
        },
        {
          $replaceRoot: { newRoot: "$roomDetails" } // Replace the root document with the room details
        }
      ]);
  
      console.log("available", availableRooms);
  
      // Return the distinct available rooms
      res.status(200).json({
        message: 'Distinct rooms available by room type',
        availableRooms
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).send('Server Error');
    }
  };
  
  //prev guest

  exports.previousGuestDetails= async (req, res) => {
    try {
      const userid = req.params.id;
      // Fetch all previous guest details from database for the given user_id
      const previousGuests = await RoomGuestModel.find({ user_id: userid , saveDetails: true });
  
      if (previousGuests && previousGuests.length > 0) {
        return res.json(previousGuests);
      } else {
        return res.status(404).json({ message: 'No previous guests found' });
      }
    } catch (error) {
      console.error('Error fetching previous guests:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  exports.saved_guests= async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find all guests for this user where saveDetails is true
      const savedGuests = await RoomGuestModel.find({ user_id: userId, saveDetails: true });
  
      if (savedGuests.length === 0) {
        return res.status(404).json({ message: 'No saved guests found for this user' });
      }
  
      res.json(savedGuests);
    } catch (error) {
      console.error('Error fetching saved guests:', error);
      res.status(500).json({ message: 'Server error while fetching saved guests' });
    }
  };

  //update guests

  exports.update_guest= async (req, res) => {
    try {
      const guestId = req.params.id;
      const updatedData = req.body;
  
      // Validate the incoming data
      const { name, email, phone, address, dob, proofType, proofNumber } = updatedData;
  
      if (!name || !email || !phone || !dob || !proofType || !proofNumber) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Perform any additional validations here if needed
  
      // Update the guest in the database
      const updatedGuest = await RoomGuestModel.findByIdAndUpdate(
        guestId,
        {
          name,
          email,
          phone,
          address,
          dob,
          proofType,
          proofNumber,
          // Don't update proofDocument here as it's typically handled separately
        },
        { new: true, runValidators: true } // Return the updated document and run schema validators
      );
  
      if (!updatedGuest) {
        return res.status(404).json({ message: 'Guest not found' });
      }
  
      res.json(updatedGuest);
    } catch (error) {
      console.error('Error updating guest:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error while updating guest' });
    }
  };
  
  //my profile

  exports.profile= async (req, res) => {
    try {
    
      const staff = await GoogleRegisterModel.findById(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
      
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  };

// Configure Cloudinary storage for user profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'staffprofilepicture',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Configure Cloudinary storage for proof documents
const proofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'proofdocs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

// Initialize multer with Cloudinary storage
const uploadProfilePhoto = multer({ storage: profileStorage });
const uploadProofDoc = multer({ storage: proofStorage });

// Update profile photo handler
exports.upload_photo = [
  uploadProfilePhoto.single('image'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get Cloudinary URL from uploaded file
      const imageUrl = req.file.path;

      // Update user's profile image in database
      const updatedUser = await GoogleRegisterModel.findByIdAndUpdate(
        userId,
        { image: imageUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        message: 'Profile image updated', 
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

//change-password

exports.change_password =async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const staff = await GoogleRegisterModel.findById(req.params.id);
  
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
  
  //profile update

  exports.profile_update= async (req, res) => {
    try {
      console.log('Updating profile for ID:', req.params.id);
      const { displayName, email, address, image, phone_no, dob } = req.body;
      console.log('Update data:', { displayName, email, address, image, phone_no, dob });

      const staff = await GoogleRegisterModel.findById(req.params.id);

      if (!staff) {
        console.log('Staff not found');
        return res.status(404).json({ message: "Staff not found" });
      }

      // Update fields only if they are provided in the request
      if (displayName) staff.displayName = displayName;
     
      if (address) staff.address = address;
      if (image) staff.image = image;
      if (phone_no) staff.phone_no = phone_no;
      if (dob) staff.dob = dob;

      console.log('Staff before save:', staff);

      const updatedStaff = await staff.save();

      console.log('Updated staff:', updatedStaff);

      res.json({ message: "Profile updated successfully", staff: updatedStaff });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Error updating profile", error: error.message });
    }
  };

//my bookings

exports.my_bookings= async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Fetch bookings and sort by _id in descending order
      const bookings = await ReservationModel.find({ user_id: userId })
        .populate({
          path: 'room_id', // Populate the room details
          select: 'images roomtype', // Select only the fields you want
        })
        .sort({ _id: -1 }); // -1 for descending order
  
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving bookings', error });
    }
  };
  
  //booking details
  exports.user_booking= async (req, res) => {
 
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

//booking cancel
exports.bookings_cancel=async (req, res) => {
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
  
  //guest proof update

  // Update guest proof document handler
  exports.guests_proofupdatess = [
    uploadProofDoc.single('proofDocument'),
    async (req, res) => {
      try {
        const guestId = req.params.id;
        const guest = await RoomGuestModel.findById(guestId);
  
        if (!guest) {
          return res.status(404).json({ 
            success: false, 
            message: 'Guest not found' 
          });
        }
  
        // Check if the guest has already checked in
        const reservation = await ReservationModel.findOne({ guestids: guestId });
        if (reservation && reservation.check_in_time) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cannot update document after check-in' 
          });
        }
    
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            message: 'No file uploaded' 
          });
        }
    
        // Get Cloudinary URL from uploaded file
        const documentUrl = req.file.path;

        // If guest has an existing document, delete it from Cloudinary
        if (guest.proofDocument) {
          try {
            const publicId = guest.proofDocument.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting old document:', error);
          }
        }

        // Update guest's proof document in database
        guest.proofDocument = documentUrl;
        await guest.save();
  
        res.status(200).json({ 
          success: true, 
          message: 'Document updated successfully',
          document: documentUrl
        });
      } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Server error',
          error: error.message 
        });
      }
    }
  ];
  
  //feedback

  exports.feedback =async (req, res) => {
    try {
      const { reservationId, hotelRating, roomRating, feedback, userId } = req.body;
  
      const newFeedback = new FeedbackModel({
        reservationId,
        userId,
        hotelRating,
        roomRating,
        feedback,
        submittedDate: new Date()
      });
  
      await newFeedback.save();
      res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ message: 'Failed to submit feedback' });
    }
  };

//confirm book

// Define storage for the uploaded files
const pack = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/proofdocs'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Define unique filename
    }
});

// File filter to restrict file types
const Filter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, JPG, and PNG are allowed.'), false); // Reject file
    }
};

// Create a multer instance with file filter
const uploadssss = multer({
    storage: pack,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: Filter
});

// Middleware to handle file uploads (you can adjust the number of files as needed)
const uploadHandler = uploadssss.array('proofDocuments', 10); // Maximum 10 files at a time


// Create a transporter using SMTP


exports.confirmbook = [
  uploadProofDoc.array('proofDocuments', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Get Cloudinary URLs from uploaded files
      const documentUrls = req.files.map(file => file.path);

      // Parse request body data
      const roomDetails = JSON.parse(req.body.roomDetails);
      const datas = JSON.parse(req.body.datas);
      const selectedGuestIds = JSON.parse(req.body.selectedGuestIds);
      const newGuestDetails = JSON.parse(req.body.newGuestDetails);
      const userid = req.body.userid;
      const totalRate = req.body.totalRate;
      const totldays = req.body.totldays;

      // Process new guests with their documents
      let fileIndex = 0;
      const newGuestIds = [];

      // Process new adults
      if (Array.isArray(newGuestDetails.adults)) {
        for (const adult of newGuestDetails.adults) {
          const proofDocument = documentUrls[fileIndex++];
          
          const newGuest = new RoomGuestModel({
            user_id: userid,
            name: adult.name,
            email: adult.email,
            phone: adult.phone,
            address: adult.address,
            dob: adult.dob,
            role: 'adult',
            proofType: adult.proofType,
            proofNumber: adult.proofNumber,
            proofDocument,
            saveDetails: adult.saveDetails,
          });

          const savedGuest = await newGuest.save();
          newGuestIds.push(savedGuest._id);
        }
      }

      // Process new children
      if (Array.isArray(newGuestDetails.children)) {
        for (const child of newGuestDetails.children) {
          const newChildGuest = new RoomGuestModel({
            name: child.name,
            dob: child.dob,
            role: 'child',
            saveDetails: child.saveDetails,
          });
          const savedChild = await newChildGuest.save();
          newGuestIds.push(savedChild._id);
        }
      }

      // Create reservation with all guest IDs
      const allGuestIds = [...selectedGuestIds, ...newGuestIds];
      const newReservation = new ReservationModel({
        user_id: userid,
        room_id: roomDetails._id,
        check_in: new Date(datas.checkInDate),
        check_out: new Date(datas.checkOutDate),
        booking_date: new Date(),
        status: 'booked',
        total_amount: totalRate,
        totaldays: totldays,
        guestids: allGuestIds,
      });

      const savedReservation = await newReservation.save();

      res.status(201).json({
        success: true,
        message: 'Room booking confirmed!',
        reservation: savedReservation,
      });
    } catch (error) {
      console.error('Error in booking process:', error);
      res.status(500).json({
        success: false,
        message: 'Error booking room',
        error: error.message,
      });
    }
  }
];

//order create

const mailtrans = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
      user:  process.env.email_id, // Replace with your email
      pass:  process.env.password // Replace with your app password
    }
  });
  
  exports.ordersss = async (req, res) => {
    const { userid, paymentId, totalRate, totldays ,reservation_id, checkInDate, checkOutDate} = req.body;
    console.log(req.body)
    console.log("email",process.env.email_id)
    try {
      // Validate the room availability before confirming the order
  
      // Create new order object
      const newBill = new BillModel({
        userid,
        paymentId, // Assuming roomDetails contains info about each room
        totalRate,
        totldays,
        orderDate: new Date(),
        status: 'Confirmed',
        reservationid: reservation_id
      });
  
      // Save the order to the database
      await newBill.save();
      const userDetails = await GoogleRegisterModel.findById(userid).select('displayName email'); // Adjust fields as needed
  
      // Fetch reservation details from Reservation model using reservation_id
      const reservationDetails = await ReservationModel.findById(reservation_id);
  
      
      // Prepare email content
      const emailContent = `
      Dear ${userDetails.displayName},
  
      Your booking has been confirmed!
  
      Booking Details:
      - Check-in: ${new Date(checkInDate).toLocaleDateString()}
      - Check-out: ${new Date(checkOutDate).toLocaleDateString()}
      - Total Amount: ₹${totalRate}
      - Number of Days: ${totldays}
  
      Thank you for choosing our service!
  
      Best regards,
      Your IntelliStay Hotel Team
  `;
  
  // Send email
  await mailtrans.sendMail({
      from:  process.env.password,
      to: userDetails.email,
      subject: 'Booking Confirmation',
      text: emailContent
  });
   console.log("email sent")
   console.log(userDetails)
   console.log(reservationDetails)
      res.status(201).json({ message: 'Payment successfully', bill: newBill , user: userDetails,  // Include user details in the response
        reservation: reservationDetails});
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  };

  //reservation cancel
  exports.reservations= async (req, res) => {
    try {
      const reservationId = req.params.id;
      await ReservationModel.findByIdAndDelete(reservationId);
      res.status(200).json({ message: "Reservation cancelled successfully" });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ message: "Failed to cancel reservation" });
    }
  };
  
exports.getMenuItemss =  async (req, res) => {
  try {
      // Fetch all active menu items
      const menuItems = await MenuItem.find({ isAvailable: true })
          .select('name description price category image preparationTime specialTags spicyLevel foodtype')
          .sort({ category: 1, name: 1 }); // Sort by category and then by name

      // Check if any menu items exist
      if (!menuItems || menuItems.length === 0) {
          return res.status(200).json([]);  // Return empty array if no items found
      }

      res.status(200).json(menuItems);

  } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching menu items',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};
  
exports.getCategoriess = async (req, res) => {
  try {
      // Fetch unique categories from available menu items
      const categories = await MenuItem.aggregate([
          // Match only available items
          { 
              $match: { 
                  isAvailable: true 
              } 
          },
          // Get unique categories
          { 
              $group: { 
                  _id: '$category' 
              } 
          },
          // Sort alphabetically
          { 
              $sort: { 
                  _id: 1 
              } 
          },
          // Project to get clean array
          { 
              $project: { 
                  category: '$_id', 
                  _id: 0 
              } 
          }
      ]);

      // Extract categories into a simple array
      const categoryList = categories.map(item => item.category);

      // Return empty array if no categories found
      if (!categoryList || categoryList.length === 0) {
          return res.status(200).json([]);
      }

      res.status(200).json(categoryList);

  } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching menu categories',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
  }
};

//cart add

exports.cart_add=async (req, res) => {
  try {
    const {
        itemTitle,
        image,
        rating,
        price,
        quantity,
        menuItemId,
        availableQuantity,
        userId,
        specialInstructions
    } = req.body;

    const subTotal = price * quantity;

    // Create new cart item
    const cartItem = new Cart({
        quantity,
        subTotal,
        menuItemId,
        availableQuantity,
        userId,
        specialInstructions: specialInstructions ? specialInstructions.trim() : ''
    });

    const savedCartItem = await cartItem.save();

        if (savedCartItem) {
            res.status(201).json({
                success: true,
                message: 'Item added to cart successfully',
                data: savedCartItem
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid cart data'
            });
        }
}catch (error) {
  console.error('Cart addition error:', error);
  res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
  });
}
}

// Get Cart Items
exports.get_cart_items = async (req, res) => {
  try {
    console.log(req.params)
      const { userId } = req.params;

      // Get all cart items for the user
      const cartItems = await Cart.find({ userId })
          .populate('menuItemId', 'name description category image price foodtype')
          .sort('-createdAt');
      console.log(cartItems)
      // Calculate cart totals
      const cartTotal = cartItems.reduce((total, item) => total + item.subTotal, 0);
      const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

      res.status(200).json({
          success: true,
          data: {
              items: cartItems,
              totalAmount: cartTotal,
              totalItems: itemCount
          }
      });

  } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching cart items',
          error: error.message
      });
  }
};

// Update Cart Item Quantity
exports.update_cart_quantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Populate the menuItemId to get access to the current price
    const cartItem = await Cart.findById(cartItemId).populate('menuItemId');
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Get the price from menuItemId
    const itemPrice = cartItem.menuItemId?.price || 0;
    
    cartItem.quantity = quantity;
    cartItem.subTotal = itemPrice * quantity;
    
    const updatedItem = await cartItem.save();

    res.status(200).json({
      success: true,
      message: 'Cart item quantity updated',
      data: updatedItem
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

// Remove Item from Cart
exports.remove_cart_item = async (req, res) => {
  try {
      const { cartItemId } = req.params;

      const result = await Cart.findByIdAndDelete(cartItemId);

      if (!result) {
          return res.status(404).json({
              success: false,
              message: 'Cart item not found'
          });
      }

      res.status(200).json({
          success: true,
          message: 'Item removed from cart successfully'
      });

  } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({
          success: false,
          message: 'Error removing cart item',
          error: error.message
      });
  }
};



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, cartItems, orderType, userId } = req.body;
    

    // Validate order type
    const validOrderTypes = ['dine-in', 'takeaway', 'delivery'];
    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order type'
      });
    }

    // Create a shorter receipt ID (max 40 characters)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const shortUserId = userId.toString().slice(-4); // Last 4 characters of userId
    const receipt = `rcpt_${timestamp}${shortUserId}`; // Format: rcpt_[8 digits timestamp][4 digits userId]

    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: receipt,
      notes: {
        orderType: orderType,
        userId: userId.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = razorpay
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Create Order in Database
exports.createOrderInDB = async (req, res) => {
  try {
    const {
      userid,
      cartItems,
      paymentDetails,
      totalAmount,
      specialInstructions,
      orderType
    } = req.body;
    console.log("cartItems",cartItems)

    // Create order document
    const order = new Order({
      user: userid,
      items: cartItems.map(item => ({
        menuItem: item.menuItemId._id,
        quantity: item.quantity,
        price: item.menuItemId.price,
        specialInstructions: specialInstructions[item._id] || ''
      })),
      totalAmount,
      orderType,
      paymentDetails: {
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_signature: paymentDetails.razorpay_signature
      },
      status: 'pending'
    });

    await order.save();

    // Clear user's cart
    await Cart.deleteMany({ userId: userid });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: order
    });

  } catch (error) {
    console.error('Create order in DB error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order in database',
      error: error.message
    });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch orders with populated menu item details
    const orders = await Order.find({ user: userId })
      .populate({
        path: 'items.menuItem',
        select: 'name price description foodtype category image'
      })
      .sort({ orderDate: -1 }); // Sort by newest first

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: 'No orders found'
      });
    }
    console.log("orders",orders)
    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Optional: Add method to get single order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate({
        path: 'cartItems.menuItemId',
        select: 'name price description foodType category image'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("orderId",orderId)
    const userId = req.body.userId; // Assuming you have auth middleware

    // Find the order
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Check if order is eligible for cancellation
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status'
      });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancellationDetails = {
      cancelledAt: new Date(),
      cancelledBy: userId,
      reason: 'Cancelled by customer'
    };

    await order.save();

    // You might want to trigger notifications here
    // await notifyRestaurant(order._id, 'ORDER_CANCELLED');
    // await notifyCustomer(order._id, 'ORDER_CANCELLED');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({isAvailable:true})
      .sort({ tableNumber: 1 });
      console.log("tables",tables)
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
      error: error.message
    });
  }
};

// Get single table
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table',
      error: error.message
    });
  }
};


exports.createTableReservation = async (req, res) => {
  try {
      const { 
          userId, 
          table_id,
          tableNumber, 
          reservationDate, 
          numberOfGuests, 
          specialRequests, 
          time 
      } = req.body;

      // Validate input
      if (!userId || !table_id || !tableNumber || !reservationDate || !numberOfGuests || !time) {
          return res.status(400).json({
              success: false,
              message: 'Please provide all required fields'
          });
      }

      // Check if table exists
      const table = await Table.findById(table_id);
      if (!table) {
          return res.status(404).json({
              success: false,
              message: 'Table not found'
          });
      }

      // Check if table capacity is sufficient
      if (numberOfGuests > table.capacity) {
          return res.status(400).json({
              success: false,
              message: 'Number of guests exceeds table capacity'
          });
      }

      // Convert date and time to Date object
      const reservationDateTime = new Date(`${reservationDate.split('T')[0]}T${time}`);

      // Check if table is already reserved for the requested time
      const existingReservation = await TableReservationModel.findOne({
          table_id,
          reservationDate: {
              $gte: new Date(reservationDateTime.setHours(reservationDateTime.getHours() - 2)),
              $lt: new Date(reservationDateTime.setHours(reservationDateTime.getHours() + 4))
          },
          status: { $nin: ['cancelled', 'completed'] }
      });

      if (existingReservation) {
          return res.status(400).json({
              success: false,
              message: 'Table is already reserved for this time slot'
          });
      }

      // Create reservation
      const reservation = await TableReservationModel.create({
          user: userId,
          table_id,
          tableNumber,
          reservationDate: reservationDateTime,
          numberOfGuests,
          specialRequests,
          time,
          status: 'pending'
      });

      // Populate user and table details
      const populatedReservation = await TableReservationModel.findById(reservation._id)
          .populate('user', 'displayName email')
          .populate('table_id', 'tableNumber capacity location');

      return res.status(201).json({
          success: true,
          message: 'Table reservation created successfully',
          data: populatedReservation
      });

  } catch (error) {
      console.error('Error creating table reservation:', error);
      return res.status(500).json({
          success: false,
          message: 'Error creating table reservation',
          error: error.message
      });
  }
};


exports.getUserReservations = async (req, res) => {
  try {
      const { userId } = req.params;

      // Check if the requesting user matches the userId parameter
      // if (req.user._id.toString() !== userId) {
      //     return res.status(403).json({
      //         success: false,
      //         message: 'Not authorized to access these reservations'
      //     });
      // }

      // Fetch all reservations for the user
      const reservations = await TableReservationModel.find({ user: userId })
          .populate('table_id', 'tableNumber capacity location')
          .sort({ reservationDate: -1 }); // Sort by date, newest first

      // Format the reservations data
      console.log("reservations",reservations)
      const formattedReservations = reservations.map(reservation => ({
          _id: reservation._id,
          reservationId: reservation.reservationId,
          tableNumber: reservation.tableNumber,
          reservationDate: reservation.reservationDate,
          time: reservation.time,
          numberOfGuests: reservation.numberOfGuests,
          specialRequests: reservation.specialRequests,
          status: reservation.status,
          table: reservation.table_id,
          createdAt: reservation.createdAt
      }));

      return res.status(200).json({
          success: true,
          message: 'Reservations fetched successfully',
          data: formattedReservations
      });

  } catch (error) {
      console.error('Error fetching user reservations:', error);
      return res.status(500).json({
          success: false,
          message: 'Error fetching reservations',
          error: error.message
      });
  }
};

exports.getConfirmedReservations = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    // Convert date string to Date object
    const reservationDate = new Date(date);
    
    // Set the time for the reservation date
    const [hours, minutes] = time.split(':');
    reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate time window (e.g., ±2 hours from reservation time)
    const startTime = new Date(reservationDate);
    startTime.setHours(startTime.getHours() - 2);
    
    const endTime = new Date(reservationDate);
    endTime.setHours(endTime.getHours() + 2);

    // Find confirmed reservations within the time window
    const confirmedReservations = await TableReservationModel.find({
      reservationDate: {
        $gte: startTime,
        $lte: endTime
      },
      status: 'confirmed'
    }).select('tableNumber -_id');

    return res.status(200).json({
      success: true,
      message: 'Confirmed reservations fetched successfully',
      data: confirmedReservations
    });

  } catch (error) {
    console.error('Error fetching confirmed reservations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching confirmed reservations',
      error: error.message
    });
  }
};



// Encryption key and IV should be stored securely (e.g., environment variables)
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY;
const IV = process.env.QR_IV;

const encryptData = (data) => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptData = (encryptedData) => {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Generate QR Code
exports.generateQRCode = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    // Find the reservation first
    const reservation = await ReservationModel.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Determine if this is check-in or check-out
    let type;
    if (!reservation.check_in_time) {
      type = 'checkin';
    } else if (!reservation.check_out_time && reservation.status === 'checked_in') {
      type = 'checkout';
    } else {
      return res.status(400).json({
        success: false,
        message: reservation.check_out_time ? 
          'Already checked out' : 
          'Must check in first'
      });
    }

    const timestamp = new Date().toISOString();
    
    // Create the data object
    const qrData = {
      reservationId,
      timestamp,
      type
    };

    // Generate hash for verification
    const hash = crypto.createHash('sha256')
      .update(`${reservationId}${timestamp}${process.env.QR_SALT}`)
      .digest('hex');

    // Add hash to QR data
    qrData.hash = hash;

    // Encrypt the entire data object
    const encryptedData = encryptData(JSON.stringify(qrData));

    // Save QR code to database
    const qrCode = new QRCode({
      data: encryptedData,
      reservationId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      type
    });
    await qrCode.save();

    res.json({
      success: true,
      qrCode: encryptedData,
      type // Include type in response for UI feedback
    });

  } catch (error) {
    console.error('QR Generation Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate QR code' 
    });
  }
};

// Decrypt and verify QR code
exports.processQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    // Decrypt QR data
    let decryptedData;
    try {
      const decryptedString = decryptData(qrData);
      decryptedData = JSON.parse(decryptedString);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid QR code format' 
      });
    }

    // Verify the data structure
    if (!decryptedData.reservationId || !decryptedData.timestamp || !decryptedData.hash || !decryptedData.type) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid QR code data structure' 
      });
    }

    // Generate hash for verification
    const expectedHash = crypto.createHash('sha256')
      .update(`${decryptedData.reservationId}${decryptedData.timestamp}${process.env.QR_SALT}`)
      .digest('hex');

    // Verify hash
    if (expectedHash !== decryptedData.hash) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid QR code signature' 
      });
    }

    // Check if QR code exists and hasn't expired
    const qrCode = await QRCode.findOne({
      data: qrData,
      expiresAt: { $gt: new Date() }
    });

    if (!qrCode) {
      return res.status(400).json({ 
        success: false,
        message: 'QR code has expired or is invalid' 
      });
    }

    // Process check-in/out
    const reservation = await ReservationModel.findById(decryptedData.reservationId);
    if (!reservation) {
      return res.status(404).json({ 
        success: false,
        message: 'Reservation not found' 
      });
    }

    // Validate status transitions
    if (decryptedData.type === 'checkin') {
      if (reservation.check_in_time || reservation.status === 'checked_in') {
        return res.status(400).json({ 
          success: false,
          message: 'Already checked in' 
        });
      }
      reservation.status = 'checked_in';
      reservation.check_in_time = new Date();
    } else if (decryptedData.type === 'checkout') {
      if (!reservation.check_in_time) {
        return res.status(400).json({ 
          success: false,
          message: 'Must check in first' 
        });
      }
      if (reservation.check_out_time || reservation.status === 'checked_out') {
        return res.status(400).json({ 
          success: false,
          message: 'Already checked out' 
        });
      }
      reservation.status = 'checked_out';
      reservation.check_out_time = new Date();
    }

    // Save changes
    await reservation.save();
    await qrCode.deleteOne(); // Remove used QR code

    res.json({
      success: true,
      message: `Successfully ${decryptedData.type === 'checkin' ? 'checked in' : 'checked out'}`,
      status: reservation.status,
      checkInTime: reservation.check_in_time,
      checkOutTime: reservation.check_out_time
    });

  } catch (error) {
    console.error('QR Processing Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process QR code',
      error: error.message 
    });
  }
};

// Utility functions for encryption/decryption



exports.getUserReservation = async (req, res, next) => {
  try {
    const { reservationId } = req.params;
    const user_id = req.headers['user_id']; // Get user_id from headers

    console.log('Searching with:', { reservationId, user_id }); // Debug log

    // Validate inputs
    if (!reservationId || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Find reservation with populated fields
    const reservation = await ReservationModel.findOne({
      _id: reservationId,
      user_id: user_id // Now we can use the user_id from headers
    })
    .populate({
      path: 'room_id',
      select: 'roomno roomtype rate description',
      model: 'room'
    })
    .populate({
      path: 'user_id',
      select: 'displayName email',
      model: 'GoogleRegisters'
    })
    .populate({
      path: 'guestids',
      select: 'name email phone',
      model: 'RoomGuest'
    })
    .lean();

    console.log('Found reservation:', reservation); // Debug log

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or unauthorized'
      });
    }

    // Format the response data
    const formattedReservation = {
      reservationId: reservation._id,
      status: reservation.status,
      roomDetails: {
        roomNumber: reservation.room_id?.roomno,
        roomType: reservation.room_id?.roomtype,
        rate: reservation.room_id?.rate,
        description: reservation.room_id?.description
      },
      userDetails: {
        name: reservation.user_id?.displayName,
        email: reservation.user_id?.email
      },
      dates: {
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        bookingDate: reservation.booking_date,
        checkInTime: reservation.check_in_time,
        checkOutTime: reservation.check_out_time,
        cancelDate: reservation.cancel_date
      },
      guests: reservation.guestids || [],
      payment: {
        totalAmount: reservation.total_amount,
        totalDays: reservation.totaldays
      },
      isVerified: reservation.is_verified
    };

    res.status(200).json({
      success: true,
      data: formattedReservation
    });

  } catch (error) {
    console.error('Error in getUserReservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation details',
      error: error.message
    });
  }
};