import React,{ useState,useEffect} from 'react';
import { Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';
import { useLocation,useNavigate } from 'react-router-dom';
import './Reserveroom.css'; // Custom CSS for styling
import Header from '../components/Header'; 
import Swal from 'sweetalert2'; // Assuming you're using SweetAlert for notifications
import axios from 'axios';
import jsPDF from 'jspdf';
import logo from '../public/logo1.png';
import facebook from './assets/facebook.png';
import instagram from './assets/instagram.png';
import youtube from './assets/youtube.png';
import useAuth from './useAuth';
import CircularProgress from '@mui/material/CircularProgress';
import Footer from '../components/footer';



const ReserveRoom = () => {
  useAuth();
  const razerkeyid=import.meta.env.VITE_RAZORPAY_KEY_ID;
  const razersecret=import.meta.env.VITE_RAZORPAY_KEY_SECRET;
  const [reservation, setReservationDetails] = useState(null);
  const navigate=useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const roomDetails = state.roomdata || {};
  console.log("room details",roomDetails);
  const datas = state.data || {};
  console.log(datas)
  const adultDetails = state.adults || [];
  console.log(adultDetails)
  const childrenDetails = state.children || [];
  const totalRate = state.totlrates || 0;
  console.log("total rate",totalRate);

  const totldays = state.totldays || 0;
  console.log("total days",totldays);
  const guestData = state.guestData || {};
  const selectedGuestIds = guestData.selectedGuestIds || [];
  const newGuestDetails = guestData.newGuestDetails || { adults: [], children: [] };
  console.log("selected guestids",selectedGuestIds);
  console.log("new guest details",newGuestDetails);
  const userid= localStorage.getItem('userId');
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
        console.log("Razorpay script loaded");
    };
    document.body.appendChild(script);

    return () => {
        document.body.removeChild(script);
    };
}, []);


  const handleBookNow = async () => {
    const formData = new FormData();
    
    // Include other data fields
    formData.append('roomDetails', JSON.stringify(roomDetails));
    formData.append('datas', JSON.stringify(datas));
    formData.append('userid', userid);
    formData.append('totalRate', totalRate);
    formData.append('totldays', totldays);
    formData.append('selectedGuestIds', JSON.stringify(selectedGuestIds));
    formData.append('newGuestDetails', JSON.stringify(newGuestDetails));

    // Only append new guest details if they exist
    if (newGuestDetails) {
      // Handle new adult details
      if (newGuestDetails.adults && newGuestDetails.adults.length > 0) {
        newGuestDetails.adults.forEach((adult, index) => {
          // Only append if it's a new guest (no _id)
          if (!adult._id) {
            formData.append(`newAdultDetails[${index}]`, JSON.stringify(adult));
            if (adult.proofDocument) {
              formData.append('proofDocuments', adult.proofDocument);
            }
          }
        });
      }

      // Handle new children details
      if (newGuestDetails.children && newGuestDetails.children.length > 0) {
        newGuestDetails.children.forEach((child, index) => {
          // Only append if it's a new guest (no _id)
          if (!child._id) {
            formData.append(`newChildrenDetails[${index}]`, JSON.stringify(child));
          }
        });
      }
    }

    // Append selected guest IDs (existing guests)
    // if (selectedGuestIds && selectedGuestIds.length > 0) {
    //   formData.append('selectedGuestIds', JSON.stringify(selectedGuestIds));
    // }

    try {
        const res = await axios.post(`${import.meta.env.VITE_API}/user/confirmbook`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (res.status === 201) {
            const totalAmount = res.data.reservation.total_amount;
            const reservationId = res.data.reservation._id; // Store reservation ID for potential deletion
            const reservationDetails = res.data.reservation; 
            const options = {
                key: razerkeyid,
                key_secret: razersecret,
                amount: parseInt(totalAmount * 100),
                currency: "INR",
                order_receipt: 'order_rcptid_' + formData.get('userid'),
                name: "INTELLISTAY PAYMENT GATEWAY",
                description: "Booking Payment",
                handler: function (response) {
                    console.log("Payment successful", response);
                    const paymentId = response.razorpay_payment_id;
                    
                    const payLoad = {
                        userid: userid,
                        paymentId,
                        totalRate,
                        totldays,
                        reservation_id: reservationId,
                        checkInDate: reservationDetails.check_in,
                        checkOutDate: reservationDetails.check_out,
                    };
                    setLoading(true);
                    axios.post(`${import.meta.env.VITE_API}/user/orders/create`, payLoad)
                         
                        .then((response) => {

                            Swal.fire("Booking and payment successful");
                            console.log(response.data.reservation);
                            console.log("user details",response.data.user)
        
         // Trigger PDF generation and download after successful booking
         const generatePDF = () => {
          const doc = new jsPDF();
let currentY = 20;

// IntelliStay Header
doc.setFontSize(28);
doc.text('IntelliStay', 105, currentY, { align: 'center' });
doc.line(10, currentY + 5, 200, currentY + 5);
currentY += 15; // Adjust Y for next section

// Reservation Confirmation Title
doc.setFontSize(18);
doc.text('Reservation Confirmation', 105, currentY, { align: 'center' });
doc.line(10, currentY + 5, 200, currentY + 5);
currentY += 15;

// Reservation Details Section
doc.setFontSize(14);
doc.text('Reservation Details', 10, currentY);
currentY += 10;

doc.setFontSize(12);
doc.text(`Room ID: ${res.data.reservation.room_id}`, 10, currentY);
doc.text(`Booking Date: ${new Date(res.data.reservation.booking_date).toLocaleDateString("en-GB")}`, 200, currentY, { align: 'right' });
currentY += 10;

doc.text(`User Name: ${response.data.user.displayName}`, 10, currentY);
doc.text(`User Email: ${response.data.user.email}`, 200, currentY, { align: 'right' });
currentY += 20;

doc.text(`Room Type: ${roomDetails.roomtype}`, 10, currentY);
doc.text(`Check-In Date: ${new Date(res.data.reservation.check_in).toLocaleDateString("en-GB")}`, 10, currentY + 10);
doc.text(`Check-Out Date: ${new Date(res.data.reservation.check_out).toLocaleDateString("en-GB")}`, 200, currentY + 10, { align: 'right' });
currentY += 20;

doc.text(`Check-In Time: 02:00 PM `, 10, currentY + 10);
doc.text(`Check-Out Time: 11:00 AM`, 200, currentY + 10, { align: 'right' });
currentY += 20;

doc.text(`Price per Night: Rs.${roomDetails.rate}`, 10, currentY);
doc.text(`Total Nights: ${totldays}`, 200, currentY, { align: 'right' });
currentY += 10;

doc.text(`Total Amount: Rs.${res.data.reservation.total_amount}`, 10, currentY);
doc.text(`Reservation Status: ${res.data.reservation.status}`, 200, currentY, { align: 'right' });
currentY += 15;

doc.line(10, currentY, 200, currentY);
currentY += 10; // Adjust Y for next section

// Check if we need a new page
const checkPageOverflow = () => {
    if (currentY > 280) { // Assuming 280 is the safe limit before page overflow
        doc.addPage();
        currentY = 20; // Reset Y for new page
    }
};

// Room Details Section
doc.setFontSize(14);
doc.text('Room Details', 10, currentY);
currentY += 10;

doc.setFontSize(12);
doc.text(`Room Name: ${roomDetails.roomtype}`, 10, currentY);
let descriptionLines = doc.splitTextToSize(roomDetails.description, 180);  // 180 is the max width of the text
doc.text(`Description: ${descriptionLines}`, 10, currentY + 10);  // Print the split description lines
currentY += 10 + descriptionLines.length * 7; 
doc.text(`Price per Night: Rs.${roomDetails.rate}`, 10, currentY + 20);
currentY += 30;

checkPageOverflow(); // Check for page overflow after room details

// Line separator between Room Details and Guest Details
doc.line(10, currentY, 200, currentY);
currentY += 10;

// Guest Details Section
doc.setFontSize(14);
doc.text('Guest Details', 10, currentY);
currentY += 10;

doc.setFontSize(12);
adultDetails.forEach((guest, index) => {
    let yOffset = currentY + index * 30; 
    let addressLines = doc.splitTextToSize(guest.address, 180); // Adjust y position for each guest
    checkPageOverflow(); // Check for page overflow for each guest entry
    doc.text(`Adult ${index + 1} Name: ${guest.name}`, 10, yOffset);
    doc.text(`Email: ${guest.email}`, 200, yOffset, { align: 'right' });
    doc.text(`Phone: ${guest.phone}`, 10, yOffset + 10);
    doc.text(`Address: ${addressLines}`, 200, yOffset + 10, { align: 'right' }); // Multiple line address

    doc.text(`Proof of Identity: ${guest.proofType}`, 10, yOffset + 20 + (addressLines.length - 1) * 7); // Adjust based on address length
    doc.text(`Proof Number: ${guest.proofNumber}`, 200, yOffset + 20 + (addressLines.length - 1) * 7, { align: 'right' });

    // Update currentY based on the number of address lines and other guest info
    currentY = yOffset + 30 + (addressLines.length - 1) * 7;
});

checkPageOverflow(); // Check for page overflow after guest details

// Line separator between Guest Details and Children Details
doc.line(10, currentY, 200, currentY);
currentY += 10;

// Children Details Section
doc.setFontSize(14);
doc.text('Children Details', 10, currentY);
currentY += 10;

doc.setFontSize(12);
if (childrenDetails.length === 0) {
  doc.setFontSize(12);
  doc.text('No children details available', 10, currentY);
  currentY += 10; // Adjust Y for the next section if needed
} else {
  doc.setFontSize(12);
  childrenDetails.forEach((child, index) => {
      let yOffset = currentY + index * 20; // Adjust y position for each child
      checkPageOverflow(); // Check for page overflow for each child entry
      doc.text(`Child ${index + 1} Name: ${child.name}`, 10, yOffset);
      doc.text(`DOB: ${child.dob}`, 200, yOffset, { align: 'right' });
      currentY = yOffset + 20;
  });
}

checkPageOverflow(); // Check for page overflow after children details

// Line separator between Children Details and Total Room Rate
doc.line(10, currentY, 200, currentY);
currentY += 10;

// Total Room Rate Section
doc.setFontSize(14);
doc.text(`Total Room Rate: Rs: ${totalRate}`, 10, currentY);
currentY += 15; // Adjust Y for any potential additional notes or sections
doc.line(10, currentY, 200, currentY); // Line at the bottom of the section

          //next page payment
          doc.addPage();
          currentY = 20; // Reset Y for new page

          // Payment Details Section
          doc.setFontSize(18);
          doc.text('Payment Details', 105, currentY, { align: 'center' });
          doc.line(10, currentY + 5, 200, currentY + 5);
          currentY += 15;

          // Include payment details
          // doc.setFontSize(14);
          // doc.text('Payment Method:', 10, currentY);
          doc.setFontSize(12);
          // doc.text(`Method: ${res.data.bill.paymentMethod}`, 10, currentY + 10); // Assuming you have paymentMethod variable
          doc.text(`Transaction ID: ${response.data.bill.paymentId}`, 10, currentY + 10);
          doc.text(`Reservation ID: ${response.data.bill.reservationid}`, 10, currentY + 20); // Assuming you have transactionId variable
          doc.text(`Payment Status: ${response.data.bill.status}`, 10, currentY + 30); // Assuming you have paymentStatus variable
          currentY += 40;

          // Total Payment Amount
          doc.setFontSize(14);
          doc.text(`Total Amount Paid: Rs.${response.data.bill.totalRate}`, 10, currentY); // Assuming you have totalAmountPaid variable
          currentY += 10;

          // Automatically download the PDF
          doc.save(`Reservation_${roomDetails.roomtype}_${Date.now()}.pdf`);
          
        };
        generatePDF();
          navigate('/'); // Redirect to orders or bookings page
              })
              .catch(error => {
                console.error("Error creating order:", error);
                // If order creation fails, delete the reservation
                deleteReservation(reservationId);
                Swal.fire("Error finalizing the booking. Please try again.");
              });
          },
          modal: {
            ondismiss: function() {
              // Handle payment modal dismissal
              console.log("Payment modal closed");
              deleteReservation(reservationId);
              console.log("Booking cancelled. The reservation has been removed.");
            }
          },
          theme: {
            color: "#3399cc"
          }
        };

        var razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function(response) {
          console.log("Payment failed", response.error);
          deleteReservation(reservationId);
          console.log({
            title: "Payment Failed",
            text: "The payment was unsuccessful. The reservation has been cancelled.",
            icon: "error"
          });
        });
        
        razorpayInstance.open();
      } else {
        Swal.fire(res.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred while booking.";
      Swal.fire(errorMessage);
      console.error("Error:", err);
    }
    
  };

  // Function to delete reservation
  const deleteReservation = async (reservationId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API}/user/reservations/${reservationId}`);
      console.log("Reservation deleted successfully");
    } catch (error) {
      console.error("Error deleting reservation:", error);
      console.log({
        title: "Error",
        text: "Failed to cancel the reservation. Please contact support.",
        icon: "error"
      });
    }
  };
  
  // Debug logs to identify the problematic data
  console.log('Room Details:', roomDetails);
  console.log('Adult Details:', adultDetails);
  console.log('Children Details:', childrenDetails);
  console.log('Guest Data:', guestData);

  // Safely format address for display
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'object') {
      // If address is an object, convert it to string
      return Object.values(address).filter(Boolean).join(', ') || 'N/A';
    }
    return address;
  };

  return (
    <>
      <div className='resroomnav'>
        <Header />
      </div>
      
      <Box sx={{ margin: { xs: '10px', md: '20px' }, marginTop: { xs: '20px', md: '40px' } }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          Reserve Room
        </Typography>

        {/* Room Details */}
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
          <Typography variant="h5" gutterBottom>
            Room Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Room Name:</strong> {String(roomDetails?.roomtype || 'N/A')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Room Type:</strong> {String(roomDetails?.roomtype || 'N/A')}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography><strong>Description:</strong> {String(roomDetails?.description || 'No description available')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Price per Night:</strong> Rs.{Number(roomDetails?.rate || 0).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Total Nights:</strong> {Number(totldays || 0)}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Guest Details */}
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
          <Typography variant="h5" gutterBottom>
            Guest Details
          </Typography>

          {/* Adults Details */}
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Adult Guests
          </Typography>
          {Array.isArray(adultDetails) && adultDetails.length > 0 ? (
            adultDetails.map((guest, index) => (
              <Box key={index} sx={{ marginBottom: 3 }}>
                <Typography><strong>Adult {index + 1} Name:</strong> {String(guest?.name || 'N/A')}</Typography>
                <Typography><strong>Email:</strong> {String(guest?.email || 'N/A')}</Typography>
                <Typography><strong>Phone:</strong> {String(guest?.phone || 'N/A')}</Typography>
                <Typography><strong>Address:</strong> {formatAddress(guest?.address)}</Typography>
                <Typography><strong>Proof of Identity:</strong> {String(guest?.proofType || 'N/A')}</Typography>
                <Typography><strong>Proof Number:</strong> {String(guest?.proofNumber || 'N/A')}</Typography>
                <Divider sx={{ marginY: 2 }} />
              </Box>
            ))
          ) : (
            <Typography>No adult guest details available.</Typography>
          )}

          {/* Children Details */}
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Children Guests
          </Typography>
          {Array.isArray(childrenDetails) && childrenDetails.length > 0 ? (
            childrenDetails.map((child, index) => (
              <Box key={index} sx={{ marginBottom: 3 }}>
                <Typography><strong>Child {index + 1} Name:</strong> {String(child?.name || 'N/A')}</Typography>
                <Typography><strong>DOB:</strong> {String(child?.dob || 'N/A')}</Typography>
                <Divider sx={{ marginY: 2 }} />
              </Box>
            ))
          ) : (
            <Typography>No children details available.</Typography>
          )}
        </Paper>

        {/* Total Room Rate */}
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
          <Typography variant="h5" gutterBottom>
            Total Room Rate
          </Typography>
          <Typography variant="h6">
            Rs.{Number(totalRate || 0).toLocaleString()}
          </Typography>
        </Paper>

        {/* Book Now Button */}
        <Box sx={{ textAlign: 'center', marginTop: 3 }}>
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            size="large"
            id='booknow'
            onClick={handleBookNow}
          >
            {loading ? 'Processing...' : 'Book Now'}
          </Button>
        </Box>
      </Box>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CircularProgress />
        </div>
      )}
      <div className='footer'>
      <Footer/>
    </div>
    </>
  );
};

export default ReserveRoom;
