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

const ReserveRoom = () => {
  useAuth();
  const razerkeyid=import.meta.env.VITE_RAZORPAY_KEY_ID;
  const razersecret=import.meta.env.VITE_RAZORPAY_KEY_SECRET;
  const [reservation, setReservationDetails] = useState(null);
  const navigate=useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const roomDetails = state.roomdata || {};
  const datas = state.data || {};
  console.log(datas)
  const adultDetails = state.adults || [];
  console.log(adultDetails)
  const childrenDetails = state.children || [];
  const totalRate = state.totlrate || 0;
  const totldays = state.totldays || 0;
  const guestData = state.guestData || {};
  const selectedGuestIds = guestData.selectedGuestIds || [];
  const newGuestDetails = guestData.newGuestDetails || { adults: [], children: [] };
  console.log("selected guestids",selectedGuestIds);
  console.log("new guest details",newGuestDetails);
  const userid= localStorage.getItem('userId');

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


  // const handleBookNow = async () => {
  //   const formData = new FormData();
  
  //   // Include other data fields
  //   formData.append('roomDetails', JSON.stringify(roomDetails));
  //   formData.append('datas', JSON.stringify(datas));
  //   formData.append('userid', userid);
  //   formData.append('totalRate', totalRate);
  //   formData.append('totldays', totldays);
  
  //   // Include adult details and their proof documents
  //   adultDetails.forEach((adult, index) => {
  //     formData.append(`adultDetails[${index}]`, JSON.stringify(adult));
  
  //     // Include proof document if available
  //     if (adult.proofDocument) {
  //       formData.append('proofDocuments', adult.proofDocument); // Changed this line
  //     }
  //   });
  
  //   // Include children details
  //   childrenDetails.forEach((child, index) => {
  //     formData.append(`childrenDetails[${index}]`, JSON.stringify(child));
  //   });
  
  //   // Send the form data to the backend
  //   try {
  //     console.log(formData);
  //     const res = await axios.post('http://localhost:3001/confirmbook', formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });
  
  //     if (res.status === 201) {
  //       Swal.fire("Booking successful");
  //       console.log(res.data.reservation);
        
  //        // Trigger PDF generation and download after successful booking
  //        const generatePDF = () => {
  //         const doc = new jsPDF();
  //         let currentY = 20;
          
  //         // IntelliStay Header
  //         doc.setFontSize(28);
  //         doc.text('IntelliStay', 105, currentY, { align: 'center' });
  //         doc.line(10, currentY + 5, 200, currentY + 5);
  //         currentY += 15; // Adjust Y for next section
          
  //         // Reservation Confirmation Title
  //         doc.setFontSize(18);
  //         doc.text('Reservation Confirmation', 105, currentY, { align: 'center' });
  //         doc.line(10, currentY + 5, 200, currentY + 5);
  //         currentY += 15;
          
  //         // Reservation Details Section
  //         doc.setFontSize(14);
  //         doc.text('Reservation Details', 10, currentY);
  //         currentY += 10;
          
  //         doc.setFontSize(12);
  //         doc.text(`Room ID: ${res.data.reservation.room_id}`, 10, currentY);
  //         doc.text(`Booking Date: ${new Date(res.data.reservation.booking_date).toLocaleDateString("en-GB")}`, 200, currentY, { align: 'right' });
  //         currentY += 10;
          
  //         doc.text(`Room Type: ${roomDetails.roomtype}`, 10, currentY);
  //         doc.text(`Check-In Date: ${new Date(res.data.reservation.check_in).toLocaleDateString("en-GB")}`, 10, currentY + 10);
  //         doc.text(`Check-Out Date: ${new Date(res.data.reservation.check_out).toLocaleDateString("en-GB")}`, 200, currentY + 10, { align: 'right' });
  //         currentY += 20;
          
  //         doc.text(`Check-In Time: 02:00 PM `, 10, currentY + 10);
  //         doc.text(`Check-Out Time: 11:00 AM`, 200, currentY + 10, { align: 'right' });
  //         currentY += 20;

  //         doc.text(`Price per Night: Rs.${roomDetails.rate}`, 10, currentY);
  //         doc.text(`Total Nights: ${totldays}`, 200, currentY, { align: 'right' });
  //         currentY += 10;
          
  //         doc.text(`Total Amount: Rs.${res.data.reservation.total_amount}`, 10, currentY);
  //         doc.text(`Reservation Status: ${res.data.reservation.status}`, 200, currentY, { align: 'right' });
  //         currentY += 15;
          
  //         doc.line(10, currentY, 200, currentY);
  //         currentY += 10; // Adjust Y for next section
          
  //         // Check if we need a new page
  //         const checkPageOverflow = () => {
  //           if (currentY > 280) { // Assuming 280 is the safe limit before page overflow
  //             doc.addPage();
  //             currentY = 20; // Reset Y for new page
  //           }
  //         };
          
  //         // Room Details Section
  //         doc.setFontSize(14);
  //         doc.text('Room Details', 10, currentY);
  //         currentY += 10;
          
  //         doc.setFontSize(12);
  //         doc.text(`Room Name: ${roomDetails.roomtype}`, 10, currentY);
  //         let descriptionLines = doc.splitTextToSize(roomDetails.description, 180);  // 180 is the max width of the text
  //         doc.text(`Description: ${descriptionLines}`, 10, currentY + 10);  // Print the split description lines
  //         currentY += 10 + descriptionLines.length * 7; 
  //         doc.text(`Price per Night: Rs.${roomDetails.rate}`, 10, currentY + 20);
  //         currentY += 30;
          
  //         checkPageOverflow(); // Check for page overflow after room details
          
  //         // Line separator between Room Details and Guest Details
  //         doc.line(10, currentY, 200, currentY);
  //         currentY += 10;
          
  //         // Guest Details Section
  //         doc.setFontSize(14);
  //         doc.text('Guest Details', 10, currentY);
  //         currentY += 10;
          
  //         doc.setFontSize(12);
  //         adultDetails.forEach((guest, index) => {
  //           let yOffset = currentY + index * 30; 
  //           let addressLines = doc.splitTextToSize(guest.address, 80); // Adjust y position for each guest
  //           checkPageOverflow(); // Check for page overflow for each guest entry
  //           doc.text(`Adult ${index + 1} Name: ${guest.name}`, 10, yOffset);
  //           doc.text(`Email: ${guest.email}`, 200, yOffset, { align: 'right' });
  //           doc.text(`Phone: ${guest.phone}`, 10, yOffset + 10);
  //           doc.text(`Address: ${addressLines}`, 10, yOffset + 10, ); // Multiple line address
  
  //           doc.text(`Proof of Identity: ${guest.proofType}`, 10, yOffset + 20 + (addressLines.length - 1) * 7); // Adjust based on address length
  //           doc.text(`Proof Number: ${guest.proofNumber}`, 200, yOffset + 20 + (addressLines.length - 1) * 7, { align: 'right' });
  
  //           // Update currentY based on the number of address lines and other guest info
  //           currentY = yOffset + 30 + (addressLines.length - 1) * 7;
  //         });
          
  //         checkPageOverflow(); // Check for page overflow after guest details
          
  //         // Line separator between Guest Details and Children Details
  //         doc.line(10, currentY, 200, currentY);
  //         currentY += 10;
          
  //         // Children Details Section
  //         doc.setFontSize(14);
  //         doc.text('Children Details', 10, currentY);
  //         currentY += 10;
          
  //         doc.setFontSize(12);
  //         childrenDetails.forEach((child, index) => {
  //           let yOffset = currentY + index * 20; // Adjust y position for each child
  //           checkPageOverflow(); // Check for page overflow for each child entry
  //           doc.text(`Child ${index + 1} Name: ${child.name}`, 10, yOffset);
  //           doc.text(`DOB: ${child.dob}`, 200, yOffset, { align: 'right' });
  //           currentY = yOffset + 20;
  //         });
          
  //         checkPageOverflow(); // Check for page overflow after children details
          
  //         // Line separator between Children Details and Total Room Rate
  //         doc.line(10, currentY, 200, currentY);
  //         currentY += 10;
          
  //         // Total Room Rate Section
  //         doc.setFontSize(14);
  //         doc.text(`Total Room Rate: Rs: ${totalRate}`, 10, currentY);
          
  //         // Automatically download the PDF
  //         doc.save(`Reservation_${roomDetails.roomtype}_${Date.now()}.pdf`);
          
  //       };
  //       generatePDF();
  //       navigate('/');
  //     } else {
  //       Swal.fire(res.data.message);
  //       console.log(error)
  //     }
  //   } catch (err) {
  //     const errorMessage = err.response?.data?.message || "An error occurred while booking.";
  //     Swal.fire(errorMessage);
  //     console.error("Error:", err);
  //   }
  // };
  
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

    // Include new adult details and their proof documents
    newGuestDetails.adults.forEach((adult, index) => {
        formData.append(`newAdultDetails[${index}]`, JSON.stringify(adult));
        if (adult.proofDocument) {
            formData.append('proofDocuments', adult.proofDocument);
        }
    });

    // Include new children details
    newGuestDetails.children.forEach((child, index) => {
        formData.append(`newChildrenDetails[${index}]`, JSON.stringify(child));
    });

    try {
        const res = await axios.post('http://localhost:3001/confirmbook', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (res.status === 201) {
            // Booking successful, now proceed to Razorpay payment
            const  totalAmount  = res.data.reservation.total_amount; // Fetch total amount from the response if needed
            
            const options = {
                key: razerkeyid,
                key_secret: razersecret,
                amount: parseInt(totalAmount * 100), // Amount in paise (hence * 100)
                currency: "INR",
                order_receipt: 'order_rcptid_' + formData.get('userid'),
                name: "INTELLISTAY PAYMENT GATEWAY", // Modify this name to match your use case
                description: "Booking Payment",
                handler: function (response) {
                    console.log("Payment successful", response);
                    
                    const paymentId = response.razorpay_payment_id;
          
  
                    // Prepare payload for order confirmation after payment
                    const payLoad = {
                        userid: userid,
                        paymentId,
                        totalRate,
                        totldays,
                        reservation_id: res.data.reservation._id // Assuming response contains reserved rooms
                    };
  
                    // Send booking confirmation after payment success
                    axios.post('http://localhost:3001/orders/create', payLoad)
                        .then((res) => {
                            Swal.fire("Booking and payment successful");
                            console.log(res.data.reservation);
                            console.log("user details",res.data.user)
        
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

doc.text(`User Name: ${res.data.user.displayName}`, 10, currentY);
doc.text(`User Email: ${res.data.user.email}`, 200, currentY, { align: 'right' });
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
          doc.text(`Transaction ID: ${res.data.bill.paymentId}`, 10, currentY + 10);
          doc.text(`Reservation ID: ${res.data.bill.reservationid}`, 10, currentY + 20); // Assuming you have transactionId variable
          doc.text(`Payment Status: ${res.data.bill.status}`, 10, currentY + 30); // Assuming you have paymentStatus variable
          currentY += 40;

          // Total Payment Amount
          doc.setFontSize(14);
          doc.text(`Total Amount Paid: Rs.${res.data.bill.totalRate}`, 10, currentY); // Assuming you have totalAmountPaid variable
          currentY += 10;

          // Automatically download the PDF
          doc.save(`Reservation_${roomDetails.roomtype}_${Date.now()}.pdf`);
          
        };
        generatePDF();
                navigate('/'); // Redirect to orders or bookings page
              })
              .catch(error => {
                console.error("Error creating order:", error);
                Swal.fire("Error finalizing the booking. Please try again.");
              });
          },
          theme: {
            color: "#3399cc"
          }
        };
  
        var razorpayInstance = new window.Razorpay(options);
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
              <Typography><strong>Room Name:</strong> {roomDetails.roomtype}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Room Type:</strong> {roomDetails.roomtype}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography><strong>Description:</strong> {roomDetails.description}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Price per Night:</strong> Rs.{roomDetails.rate} </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Total Nights:</strong> {totldays}</Typography>
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
          {adultDetails.length > 0 ? (
            adultDetails.map((guest, index) => (
              <Box key={index} sx={{ marginBottom: 3 }}>
                <Typography><strong>Adult {index + 1} Name:</strong> {guest.name}</Typography>
                <Typography><strong>Email:</strong> {guest.email}</Typography>
                <Typography><strong>Phone:</strong> {guest.phone}</Typography>
                <Typography><strong>Address:</strong> {guest.address}</Typography>
                <Typography><strong>Proof of Identity:</strong> {guest.proofType}</Typography>
                <Typography><strong>Proof Number:</strong> {guest.proofNumber}</Typography>
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
          {childrenDetails.length > 0 ? (
            childrenDetails.map((child, index) => (
              <Box key={index} sx={{ marginBottom: 3 }}>
                <Typography><strong>Child {index + 1} Name:</strong> {child.name}</Typography>
                <Typography><strong>DOB:</strong> {child.dob}</Typography>
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
            Rs.{totalRate}
          </Typography>
        </Paper>

        {/* Book Now Button */}
        <Box sx={{ textAlign: 'center', marginTop: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            id='booknow'
            onClick={handleBookNow}
          >
            Book Now
          </Button>
        </Box>
      </Box>
      <footer className="footer" id="contact">
        <div className="section__container footer__container">
          <div className="footer__col">
            <div className="logo">
              <a href="#home"><img src={logo} alt="logo" /></a>
            </div>
            <p className="section__description">
              Discover a world of comfort, luxury, and adventure as you explore
              our curated selection of hotels, making every moment of your getaway
              truly extraordinary.
            </p>
            <button className="btn">Book Now</button>
          </div>
          <div className="footer__col">
            <h4>QUICK LINKS</h4>
            <ul className="footer__links">
              <li><a href="#">Browse Destinations</a></li>
              <li><a href="#">Special Offers & Packages</a></li>
              <li><a href="#">Room Types & Amenities</a></li>
              <li><a href="#">Customer Reviews & Ratings</a></li>
              <li><a href="#">Travel Tips & Guides</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>OUR SERVICES</h4>
            <ul className="footer__links">
              <li><a href="#">Concierge Assistance</a></li>
              <li><a href="#">Flexible Booking Options</a></li>
              <li><a href="#">Airport Transfers</a></li>
              <li><a href="#">Wellness & Recreation</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>CONTACT US</h4>
            <ul className="footer__links">
              <li><a href="#">intellistay@info.com</a></li>
            </ul>
            <div className="footer__socials">
              <a href="#"><img src={facebook} alt="facebook" /></a>
              <a href="#"><img src={instagram} alt="instagram" /></a>
              <a href="#"><img src={youtube} alt="youtube" /></a>
            </div>
          </div>
        </div>
        <div className="footer__bar">
          Copyright © 2024 INTELLISTAY Pvt.LTD. All rights reserved.
        </div>
      </footer>
    </>
  );
};

export default ReserveRoom;
