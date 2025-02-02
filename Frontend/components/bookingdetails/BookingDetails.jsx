import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Button, Avatar, Modal, IconButton } from "@mui/material";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import { useSpring, animated } from "react-spring";
import useAuth from '../../src/useAuth';
import Header from '../Header';
import './BookingDetails.css';
import { useParams } from 'react-router-dom';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Swal from "sweetalert2";
import CancelIcon from '@mui/icons-material/Cancel'; // Import Cancel icon
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending'; // Import Pending icon
import Rating from '@mui/material/Rating';
import StarIcon from '@mui/icons-material/Star';
import { TextField } from '@mui/material';
import QRGenerator from '../../src/components/QRSystem/QRGenerator';
import { Alert } from '@mui/material';


const BookingDetails = () => {
  useAuth();
  const { bookingId } = useParams();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [modalType, setModalType] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // State for zoom level
  const [refresh, setRefresh] = useState(false);
  const [hotelRating, setHotelRating] = useState(0);
  const [roomRating, setRoomRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Added for counting adults and children
  let adultCount = 0;
  let childCount = 0;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      setError(null); // Reset any previous error state

      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/user/user-booking/${bookingId}`);

        if (response.status === 200) {
          setBookingDetails(response.data); // response.data contains reservation, room, and guests
        } else {
          setError("Failed to fetch booking details.");
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
        setError("An error occurred while fetching booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId,refresh]);

  const modalAnimation = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? "scale(1)" : "scale(0.8)",
    config: { tension: 300, friction: 25 },
  });

  const handleOpenModal = (content, type) => {
    setCurrentDocument(content);
    setModalType(type);
    setOpen(true);
    setZoomLevel(1); // Reset zoom level when modal opens
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleNextImage = () => {
    if (bookingDetails && bookingDetails.room.images) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bookingDetails.room.images.length);
    }
  };

  const handlePrevImage = () => {
    if (bookingDetails && bookingDetails.room.images) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + bookingDetails.room.images.length) % bookingDetails.room.images.length);
    }
  };

  // Zoom in and zoom out handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3)); // Maximum zoom level of 3
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 1)); // Minimum zoom level of 1
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>{error}</Typography>;
  }

  if (!bookingDetails) {
    return <Typography>No booking details available.</Typography>;
  }

  const { reservation, room, guests ,bill} = bookingDetails;
  const checkInDate = new Date(reservation.check_in);
  const currentDate = new Date();
  const isCancellationAllowed = checkInDate >= currentDate;// More than 2 days
  const handleCancelBooking = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to cancel the booking? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
           
          const response = await axios.post(`${import.meta.env.VITE_API}/user/user-bookings/cancel/${reservation._id}`);
          Swal.fire('Cancelled!', response.data.message, 'success');
          setRefresh(prev => !prev);
        } catch (error) {
          Swal.fire('Error!', error.response.data.message || 'An error occurred while cancelling the booking.', 'error');
        }
      }
    });
  };

  const handleUpdateDocument = (guestId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf, image/jpeg, image/jpg, image/png'; // Accept specific formats
    
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
  
      // Check file size (maximum 2MB)
      const maxFileSizeMB = 2; // 2MB
      const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']; // Allowed formats
  
      if (file) {
        if (!allowedFileTypes.includes(file.type)) {
          // File type validation
          Swal.fire({
            icon: 'error',
            title: 'Invalid file type',
            text: 'Please upload a PDF, JPEG, JPG, or PNG file only.',
          });
          return;
        }
  
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          // File size validation
          Swal.fire({
            icon: 'error',
            title: 'File size exceeds limit',
            text: `Please upload a file smaller than ${maxFileSizeMB}MB.`,
          });
          return;
        }
  
        const formData = new FormData();
        formData.append('proofDocument', file);
  
        try {
          const response = await axios.post(`${import.meta.env.VITE_API}/user/guests-proofupdatess/${guestId}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          if (response.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Document updated successfully!',
            });
            setRefresh(prev => !prev);
            // Reload or refresh the document list as needed
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed to update document',
              text: response.data.message || 'An unknown error occurred.',
            });
          }
        } catch (error) {
          console.error('Error updating document:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating the document. Please try again later.',
          });
        }
      }
    };
  
    fileInput.click();  // Trigger the file selection dialog
  };
  

  const handleFeedbackSubmit = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/user/feedback`, {
        reservationId: reservation._id,
        hotelRating,
        roomRating,
        feedback,
        userId: localStorage.getItem('userId')
      });

      if (response.status === 201) {
        setFeedbackSubmitted(true);
        Swal.fire('Success', 'Thank you for your feedback!', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to submit feedback. Please try again.', 'error');
    }
  };

  const checkIn = new Date(reservation.check_in);
  const cancellationDate = reservation.cancel_date ? new Date(reservation.cancel_date) : null;

  // Calculate the difference in days
  const daysUntilCheckIn = Math.ceil((checkIn - new Date()) / (1000 * 60 * 60 * 24)); // Difference in days

  // Determine payment status
  let paymentStatus = bill.status;

  // Check if cancellation is done 2 days before check-in
  if (cancellationDate && daysUntilCheckIn >= 2) {
      paymentStatus = 'Refunded';
  }

  return (
    <div id="booking-info">
      <div className='MyBookingsnav'>
        <Header />
      </div>
      <Box p={4}>
        <Typography variant="h5" gutterBottom style={{ fontWeight: "bold", textAlign: "center", position: "relative" }}>
          Booking Details
          <Box
    component="span"
    sx={{
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '10%', // Adjust the width of the underline
      height: '3px', // Adjust the height of the underline
      backgroundColor: 'skyblue', // Set the color to skyblue
    }}
  />
        </Typography>
        <Grid container spacing={3}>


            
          {/* Reservation Information */}
          <Grid item xs={12}>
  <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
    <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center", paddingBottom: "5px" }}>
      Reservation Details
    </Typography>
    
    <Typography variant="body1"><strong>Reservation id:</strong> {reservation._id}</Typography>
    <Typography variant="body1"><strong>Booking Date:</strong> {new Date(reservation.booking_date).toLocaleDateString("en-GB")}</Typography>
    <Typography variant="body1"><strong>Check_In Date:</strong> {new Date(reservation.check_in).toLocaleDateString("en-GB")}</Typography>
    <Typography variant="body1"><strong>Check_Out Date:</strong> {new Date(reservation.check_out).toLocaleDateString("en-GB")}</Typography>
    <Typography variant="body1"><strong>Check_In Time:</strong> 02:00 PM</Typography>
    <Typography variant="body1"><strong>Check_Out Time:</strong> 11:00 AM</Typography>
    <Typography variant="body1"><strong>Total nights:</strong> {reservation.totaldays}</Typography>
    <Typography variant="body1"><strong>Total Amount:</strong> {reservation.total_amount}</Typography>
    <Typography variant="body1"><strong>No of Guests:</strong> {reservation.guestids.length}</Typography>

    {/* Conditionally show Check_In Time if it's not null */}
    {reservation.check_in_time && (
      <Typography variant="body1">
        <strong>Check_In Time by user:</strong> {new Date(reservation.check_in_time).toLocaleTimeString("en-GB")}
      </Typography>
    )}

    {/* Conditionally show Check_Out Time if it's not null */}
    {reservation.check_out_time && (
      <Typography variant="body1">
        <strong>Check_Out Time by user:</strong> {new Date(reservation.check_out_time).toLocaleTimeString("en-GB")}
      </Typography>
    )}

<Typography variant="body1" style={{ display: 'flex', alignItems: 'center' }}> {/* Align items center */}
        <strong>Status:</strong> 
        <span style={{ color: reservation.status === 'Cancelled' ? 'red' : 'green', marginLeft: '4px' }}>
          {reservation.status}
        </span>
        
        {reservation.status === 'Cancelled' ? (
          <>
            <CancelIcon style={{ color: 'red', marginLeft: '8px', padding: "4px" }} />
            <Typography variant="body2" style={{ marginLeft: '8px' }}>
              <strong>Cancelled Date:</strong> {new Date(reservation.cancel_date).toLocaleDateString("en-GB")}
            </Typography>
          </>
        ) : (
          <>
            <CheckCircleIcon style={{ color: 'green', marginLeft: '8px' }} />
          </>
        )}
      </Typography>
  </Paper>
</Grid>

            {/* Guest Information */}
          <Grid item xs={12} >
            <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
              <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center" }}>
                Guest Details
              </Typography>
              {guests.map((guest, index) => {
                let guestRoleHeading = "";
                if (guest.role === "adult") {
                  adultCount += 1;
                  guestRoleHeading = `Adult ${adultCount}`;
                } else if (guest.role === "child") {
                  childCount += 1;
                  guestRoleHeading = `Child ${childCount}`;
                }

                return (
                  <Box key={index} mb={2} p={2} style={{ border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                    <Typography variant="h6" gutterBottom style={{ fontWeight: "bold", color: "red" }}>
                      {guestRoleHeading}
                    </Typography>
                    <Typography variant="body1"><strong>Name:</strong> {guest.name}</Typography>
                    <Typography variant="body1"><strong>Email:</strong> {guest.email}</Typography>
                    <Typography variant="body1"><strong>Phone:</strong> {guest.phone}</Typography>
                    <Typography variant="body1"><strong>Address:</strong> {guest.address}</Typography>
                    <Typography variant="body1"><strong>Date of Birth:</strong> {new Date(guest.dob).toLocaleDateString("en-GB")}</Typography>
                    <Typography variant="body1"><strong>Proof Type:</strong> {guest.proofType}</Typography>
                    <Typography variant="body1"><strong>Proof Number:</strong> {guest.proofNumber}</Typography>
                  </Box>
                );
              })}
            </Paper>
          </Grid>



          {/* Room Information */}
          <Grid item xs={12} >
            <animated.div>
              <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#FFBF00", color: "#111" }}>
                <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center" }}>Room Information</Typography>
                {/* Room Images Section */}
                {room.images && room.images.length > 0 ? (
                  <Box display="flex" flexDirection="column" alignItems="center" mb={2} mt={2}>
                    <Box position="relative" display="flex" justifyContent="center">
                      <Button onClick={handlePrevImage} style={{ position: "absolute", left: 0 }}>&lt;</Button>
                      <Box
                        component="img"
                        src={`${import.meta.env.VITE_API}/uploads/${room.images[currentImageIndex]}`}
                        alt={`Room Image ${currentImageIndex + 1}`}
                        style={{
                          width: "500px", // Adjust size as needed
                          height: "300px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          objectFit: "cover",
                        }}
                        onClick={() => handleOpenModal(room.images[currentImageIndex], "room")}
                      />
                      <Button onClick={handleNextImage} style={{ position: "absolute", right: 0 }}>&gt;</Button>
                    </Box>
                    <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="center" mt={1}>
                      {room.images.map((image, index) => (
                        <Box key={index} mb={1} mr={1}>
                          <Box
                            component="img"
                            src={`${import.meta.env.VITE_API}/uploads/${image}`}
                            alt={`Room Thumbnail ${index + 1}`}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              opacity: currentImageIndex === index ? 1 : 0.5, // Highlight the current image
                            }}
                            onClick={() => setCurrentImageIndex(index)} // Change the current image index on click
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">No images available for this room.</Typography>
                )}
                <Typography variant="body1"><strong>Room Number:</strong> {room.roomno}</Typography>
                <Typography variant="body1"><strong>Room Type:</strong> {room.roomtype}</Typography>
                <Typography variant="body1"><strong>Check-In Date:</strong> {new Date(reservation.check_in).toLocaleDateString("en-GB")}</Typography>
                <Typography variant="body1"><strong>Check-Out Date:</strong> {new Date(reservation.check_out).toLocaleDateString("en-GB")}</Typography>
                <Typography variant="body1"><strong>Total Amount:</strong> Rs.{reservation.total_amount}</Typography>
              </Paper>
            </animated.div>
          </Grid>

          {/* Proof Documents */}
          <Grid item xs={12}>
  <animated.div>
    <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
      <Typography variant="h5" style={{ fontWeight: "bold" }}>Proof Documents</Typography>
      {guests.map((guest, guestIndex) => (
        <div key={guestIndex}>
          <Typography variant="h6" gutterBottom style={{ fontWeight: "bold" }}>{guest.name}'s Documents</Typography>
          {guest.proofDocument && guest.proofDocument.length > 0 ? (
            <Box key={guest._id} mb={2}>
              <Avatar
                src={guest.proofDocument}
                alt={`Document ${guest._id + 1}`}
                style={{ width: "100px", height: "100px", cursor: "pointer" }}
                onClick={() => handleOpenModal(guest.proofDocument, "proof")}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">No proof documents available for this guest.</Typography>
          )}
          
          {/* Update Document Button - Only if checkInTime is null and reservation is not cancelled */}
          {!reservation.check_in_time && reservation.status !== 'Cancelled' ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleUpdateDocument(guest._id)}
            >
              Update Document
            </Button>
          ) : (
            reservation.status === 'Cancelled' ? (
              <Typography variant="body2" color="error"></Typography>
            ) : (
              <Typography variant="body2" color="error">Document update not allowed after check-in.</Typography>
            )
          )}
        </div>
      ))}
    </Paper>
  </animated.div>
</Grid>


<Grid item xs={12}>
            <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
                <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center", paddingBottom: "5px" }}>
                    Payment Details
                </Typography>
                
                {bill && Object.keys(bill).length > 0 ? (
                    <>
                        <Typography variant="body1"><strong>Reservation ID:</strong> {bill.reservationid}</Typography>
                        <Typography variant="body1"><strong>Transaction ID:</strong> {bill.paymentId}</Typography>
                        <Typography variant="body1"><strong>Amount Paid:</strong> {bill.totalRate}</Typography>

                        <Typography variant="body1" style={{ display: 'flex', alignItems: 'center' }}>
                            <strong>Payment Status:</strong> 
                            <span style={{ color: paymentStatus === 'pending' ? 'red' : paymentStatus === 'Refunded' ? 'red' : 'green', marginLeft: '4px' }}>
                                {paymentStatus}
                            </span>
                            
                            {paymentStatus === 'pending' ? (
                                <CancelIcon style={{ color: 'red', marginLeft: '8px', padding: "4px" }} />
                            ) : paymentStatus === 'Refunded' ? (
                                <PendingIcon style={{ color: 'red', marginLeft: '8px' }} />
                            ) : (
                                <CheckCircleIcon style={{ color: 'green', marginLeft: '8px' }} />
                            )}
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1" style={{ textAlign: 'center' }}>No payment details available.</Typography>
                )}
            </Paper>
        </Grid>


{isCancellationAllowed && (
  <Grid item xs={12}>
    <Typography variant="h6" gutterBottom style={{ fontWeight: "bold", marginTop: "20px" }}>
      Cancellation Rules:
    </Typography>
    <Typography variant="body2" color="textSecondary" paragraph>
      - Full refund is available if cancelled 2 days before the check-in date.<br />
      - No refund is available if cancelled within 2 days of the check-in date.
    </Typography>

    {/* Check if check_in_time is null to determine button visibility */}
    {reservation.check_in_time ? null : (
      <>
        {/* Show the Cancel button in red if reservation is already cancelled */}
        {reservation.status === 'Cancelled' ? (
          <Button
            variant="contained"
            style={{ backgroundColor: "red", color: "white", marginTop: "20px" }}
            disabled
          >
            Reservation Cancelled
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCancelBooking}
            style={{ marginTop: "20px" }}
          >
            Cancel Booking
          </Button>
        )}
      </>
    )}
  </Grid>
)}

      </Grid>

      {reservation.check_in_time && !feedbackSubmitted && (
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#F0F8FF", color: "#111", marginTop: "20px" }}>
            <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center", marginBottom: "20px" }}>
              Share Your Experience
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Hotel Rating */}
              <Box>
                <Typography component="legend" style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Hotel Rating
                </Typography>
                <Rating
                  name="hotel-rating"
                  value={hotelRating}
                  onChange={(event, newValue) => setHotelRating(newValue)}
                  precision={0.5}
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                  size="large"
                />
              </Box>

              {/* Room Rating */}
              <Box>
                <Typography component="legend" style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Room Rating
                </Typography>
                <Rating
                  name="room-rating"
                  value={roomRating}
                  onChange={(event, newValue) => setRoomRating(newValue)}
                  precision={0.5}
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                  size="large"
                />
              </Box>

              {/* Feedback Text */}
              <TextField
                label="Share your thoughts about your stay"
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                variant="outlined"
                fullWidth
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleFeedbackSubmit}
                disabled={!hotelRating || !roomRating}
                style={{ marginTop: "10px" }}
              >
                Submit Feedback
              </Button>
            </Box>
          </Paper>
        </Grid>
      )}

      {feedbackSubmitted && (
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#E8F5E9", color: "#111", marginTop: "20px" }}>
            <Typography variant="h6" style={{ textAlign: "center", color: "green" }}>
              Thank you for sharing your feedback!
            </Typography>
          </Paper>
        </Grid>
      )}
        {/* Modal for Viewing Documents */}
        <Modal
      open={open}
      onClose={handleCloseModal}
      fullWidth
      maxWidth="md"
      sx={{ backgroundColor: 'transparent' }} // Make modal background transparent
    >
      <animated.div style={modalAnimation}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh', // Use full viewport height
             // The paper background will remain opaque
            borderRadius: '8px',
            boxShadow: 24,
            p: 2,
          }}
        >
          <IconButton onClick={handleCloseModal} style={{ position: "absolute", top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>
          {modalType === "room" && (
            <Box display="flex" flexDirection="column" alignItems="center" height="100%">
              <Typography variant="h6" gutterBottom>Room Image</Typography>
              <Box
                component="img"
                src={`${import.meta.env.VITE_API}/uploads/${currentDocument}`}
                alt="Room"
                style={{
                  width: `${zoomLevel * 100}%`, // Adjust width based on zoom level
                  height: "auto",
                  borderRadius: "10px",
                  maxHeight: "80vh", // Prevent the image from exceeding the viewport height
                  objectFit: "contain", // Maintain aspect ratio
                }}
              />
              <Box mt={2} display="flex" justifyContent="center">
                <IconButton onClick={handleZoomIn} aria-label="Zoom In">
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut} aria-label="Zoom Out">
                  <ZoomOutIcon />
                </IconButton>
              </Box>
            </Box>
          )}
          {modalType === "proof" && (
            <Box display="flex" flexDirection="column" alignItems="center" height="100%">
              <Typography variant="h6" gutterBottom>Proof Document</Typography>
              <Box
                component="img"
                src={`${import.meta.env.VITE_API}/profdocs/${currentDocument}`}
                alt="Proof Document"
                style={{
                  width: `${zoomLevel * 100}%`, // Adjust width based on zoom level
                  height: "auto",
                  borderRadius: "10px",
                  maxHeight: "80vh", // Prevent the image from exceeding the viewport height
                  objectFit: "contain", // Maintain aspect ratio
                }}
              />
              <Box mt={2} display="flex" justifyContent="center">
                <IconButton onClick={handleZoomIn} aria-label="Zoom In">
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut} aria-label="Zoom Out">
                  <ZoomOutIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </animated.div>
    </Modal>

      </Box>

      {/* QR Code Generator Section */}
      <Grid item xs={12}>
        <Paper elevation={3} style={{ 
          padding: "20px", 
          backgroundColor: "#93C572", 
          color: "#111",
          marginTop: "20px" 
        }}>
          <Typography variant="h5" style={{ 
            fontWeight: "bold", 
            textAlign: "center", 
            marginBottom: "20px" 
          }}>
            Self Check-In/Out
          </Typography>

          {/* Only show QR generator if reservation is confirmed or checked in */}
          {reservation && (reservation.status === 'booked' || reservation.status === 'checked_in') ? (
            <Box sx={{ 
              backgroundColor: '#fff', 
              padding: 2, 
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <QRGenerator 
                reservationId={reservation._id} 
              />
            </Box>
          ) : (
            <Alert severity="info" style={{ backgroundColor: '#fff' }}>
              QR Code generation is only available for confirmed or checked-in reservations.
            </Alert>
          )}

          {/* Instructions for guests */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" style={{ 
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '10px'
            }}>
              <strong>How to use:</strong>
              <ol style={{ marginTop: '10px' }}>
                <li>Click "Generate QR Code" when you're ready to check in/out</li>
                <li>Save or take a screenshot of the QR code</li>
                <li>Visit our self-service kiosk in the hotel lobby</li>
                <li>Scan the QR code at the kiosk</li>
                <li>
                  {reservation?.status === 'checked_in' 
                    ? 'Complete your check-out process' 
                    : 'Collect your room key from the dispenser'}
                </li>
              </ol>
            </Typography>
          </Box>

          {/* Important Notes */}
          <Alert 
            severity="warning" 
            style={{ 
              marginTop: '15px',
              backgroundColor: '#fff' 
            }}
          >
            <Typography variant="body2">
              <strong>Important:</strong>
              <ul style={{ marginTop: '5px', marginBottom: '0' }}>
                <li>QR codes are valid for 5 minutes after generation</li>
                <li>Generate a new code if the current one expires</li>
                <li>Keep your QR code private and secure</li>
              </ul>
            </Typography>
          </Alert>
        </Paper>
      </Grid>
    </div>
  );
};

export default BookingDetails;

