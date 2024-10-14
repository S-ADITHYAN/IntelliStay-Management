import React,{ useState} from 'react';
import { Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';
import { useLocation,useNavigate } from 'react-router-dom';
import './Reserveroom.css'; // Custom CSS for styling
import Header from '../components/Header'; 
import Swal from 'sweetalert2'; // Assuming you're using SweetAlert for notifications
import axios from 'axios';
import jsPDF from 'jspdf';

const ReserveRoom = () => {
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
  
  const userid= localStorage.getItem('userId');

  


  const handleBookNow = async () => {
    const formData = new FormData();
  
    // Include other data fields
    formData.append('roomDetails', JSON.stringify(roomDetails));
    formData.append('datas', JSON.stringify(datas));
    formData.append('userid', userid);
    formData.append('totalRate', totalRate);
    formData.append('totldays', totldays);
  
    // Include adult details and their proof documents
    adultDetails.forEach((adult, index) => {
      formData.append(`adultDetails[${index}]`, JSON.stringify(adult));
  
      // Include proof document if available
      if (adult.proofDocument) {
        formData.append('proofDocuments', adult.proofDocument); // Changed this line
      }
    });
  
    // Include children details
    childrenDetails.forEach((child, index) => {
      formData.append(`childrenDetails[${index}]`, JSON.stringify(child));
    });
  
    // Send the form data to the backend
    try {
      console.log(formData);
      const res = await axios.post('http://localhost:3001/confirmbook', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (res.status === 201) {
        Swal.fire("Booking successful");
        console.log(res.data.reservation);
        
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
          
          doc.text(`Room Type: ${roomDetails.roomtype}`, 10, currentY);
          doc.text(`Check-In Date: ${new Date(res.data.reservation.check_in).toLocaleDateString("en-GB")}`, 10, currentY + 10);
          doc.text(`Check-Out Date: ${new Date(res.data.reservation.check_out).toLocaleDateString("en-GB")}`, 200, currentY + 10, { align: 'right' });
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
            let addressLines = doc.splitTextToSize(guest.address, 80); // Adjust y position for each guest
            checkPageOverflow(); // Check for page overflow for each guest entry
            doc.text(`Adult ${index + 1} Name: ${guest.name}`, 10, yOffset);
            doc.text(`Email: ${guest.email}`, 200, yOffset, { align: 'right' });
            doc.text(`Phone: ${guest.phone}`, 10, yOffset + 10);
            doc.text(`Address: ${addressLines}`, 10, yOffset + 10, ); // Multiple line address
  
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
          childrenDetails.forEach((child, index) => {
            let yOffset = currentY + index * 20; // Adjust y position for each child
            checkPageOverflow(); // Check for page overflow for each child entry
            doc.text(`Child ${index + 1} Name: ${child.name}`, 10, yOffset);
            doc.text(`DOB: ${child.dob}`, 200, yOffset, { align: 'right' });
            currentY = yOffset + 20;
          });
          
          checkPageOverflow(); // Check for page overflow after children details
          
          // Line separator between Children Details and Total Room Rate
          doc.line(10, currentY, 200, currentY);
          currentY += 10;
          
          // Total Room Rate Section
          doc.setFontSize(14);
          doc.text(`Total Room Rate: Rs: ${totalRate}`, 10, currentY);
          
          // Automatically download the PDF
          doc.save(`Reservation_${roomDetails.roomtype}_${Date.now()}.pdf`);
          
        };
        generatePDF();
        navigate('/');
      } else {
        Swal.fire(res.data.message);
        console.log(error)
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
            onClick={handleBookNow}
          >
            Book Now
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ReserveRoom;
