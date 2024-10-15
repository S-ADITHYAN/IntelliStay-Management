import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import useAuth from "../../useAuth";

const ConfirmRoom = () => {
  useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  // Destructuring state with default values to avoid undefined errors
  const {
    roomdata ,
    adults = [],
    children = [],
    totlrate = 0,
    totldays = 0,
     checkInDate,
    checkOutDate
  } = state;


  console.log(roomdata)
  console.log(adults)
  // Loading state for when the booking request is being processed
  const [isLoading, setIsLoading] = useState(false);

  const handleBookNow = async () => {
    // Ensure the button cannot be clicked multiple times
    if (isLoading) return;

    setIsLoading(true); // Start loading

    const bookingData = {
      roomDetails: roomdata,
      adults,
      children,
      totalRate: totlrate,
      totldays,
      checkInDate,
      checkOutDate
    };

    try {
      const res = await axios.post('http://localhost:3001/staff/confirmbook', bookingData, {
        headers: {
          'Content-Type': 'application/json', // JSON format is used here instead of FormData
        },
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire('Booking successful');
        navigate('/dashboard/reserveroom');
      } else {
        Swal.fire(res.data.message || 'Unexpected error occurred.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while booking.';
      Swal.fire(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false); // Stop loading after the request is complete
    }
  };

  return (
    <Box sx={{ margin: { xs: '10px', md: '20px' }, marginTop: { xs: '20px', md: '40px' } }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
        Confirm Room
      </Typography>

      {/* Room Details */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h5" gutterBottom>
          Room Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography><strong>Room Name:</strong> {roomdata.roomtype}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography><strong>Price per Night:</strong> Rs.{roomdata.rate}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography><strong>Description:</strong> {roomdata.description}</Typography>
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

        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Adults
        </Typography>
        {adults.length > 0 ? (
          adults.map((guest, index) => (
            <React.Fragment key={index}>
              <Typography><strong>Adult {index + 1} Name:</strong> {guest.name}</Typography>
              <Typography><strong>Proof of Identity:</strong> {guest.proofType}</Typography>
              {index < adults.length - 1 && <Divider sx={{ marginY: 2 }} />}
            </React.Fragment>
          ))
        ) : (
          <Typography>No adult guest details available.</Typography>
        )}

        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Children
        </Typography>
        {children.length > 0 ? (
          children.map((child, index) => (
            <React.Fragment key={index}>
              <Typography><strong>Child {index + 1} Name:</strong> {child.name}</Typography>
              <Typography><strong>Date of Birth:</strong> {child.dob}</Typography>
              {index < children.length - 1 && <Divider sx={{ marginY: 2 }} />}
            </React.Fragment>
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
        <Typography variant="h6">{totlrate} USD</Typography>
      </Paper>

      {/* Book Now Button */}
      <Box sx={{ textAlign: 'center', marginTop: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleBookNow}
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? 'Processing...' : 'Book Now'}
        </Button>
      </Box>
    </Box>
  );
};

export default ConfirmRoom;
