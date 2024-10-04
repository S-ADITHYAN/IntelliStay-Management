import React from 'react';
import { Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';
import { useLocation,useNavigate } from 'react-router-dom';
import './Reserveroom.css'; // Custom CSS for styling
import Header from '../components/Header'; 
import Swal from 'sweetalert2'; // Assuming you're using SweetAlert for notifications
import axios from 'axios';

const ReserveRoom = () => {
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
            {totalRate} USD
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
