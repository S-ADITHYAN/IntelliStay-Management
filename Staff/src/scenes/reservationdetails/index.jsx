import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Button, Avatar } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import RoomIcon from "@mui/icons-material/Room";
import DescriptionIcon from "@mui/icons-material/Description";
import { useSpring, animated } from "react-spring";

const ReservationDetails = () => {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/staff-reservations_details/${id}`);
        setReservation(response.data);
      } catch (error) {
        console.error("Error fetching reservation details", error);
      }
    };
    fetchReservation();
  }, [id]);

  const animatedProps = useSpring({ opacity: 1, from: { opacity: 0 } });

  if (!reservation) {
    return <Typography>Loading reservation details...</Typography>;
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Reservation Details
      </Typography>
      <Grid container spacing={3}>
        {/* Guest Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h5">Guest Information</Typography>
            {reservation.guests.map((guest, index) => (
              <div key={index}>
                <Typography variant="body1"><strong>Name:</strong> {guest.name}</Typography>
                <Typography variant="body1"><strong>Email:</strong> {guest.email}</Typography>
                <Typography variant="body1"><strong>Phone:</strong> {guest.phone}</Typography>
                <Typography variant="body1"><strong>Address:</strong> {guest.address}</Typography>
                <Typography variant="body1"><strong>Dob:</strong> {guest.dob}</Typography>
                <Typography variant="body1"><strong>ProofType:</strong> {guest.proofType}</Typography>
                <Typography variant="body1"><strong>ProofNumber:</strong> {guest.proofNumber}</Typography>
              </div>
            ))}
          </Paper>
        </Grid>

        {/* Room Information */}
        <Grid item xs={12} md={6}>
          <animated.div style={animatedProps}>
            <Paper elevation={3} style={{ padding: "20px" }}>
              <Typography variant="h5">Room Information</Typography>
              <Typography variant="body1"><RoomIcon /> Room Number: {reservation.room.roomno}</Typography>
              <Typography variant="body1"><strong>Room Type:</strong> {reservation.room.roomtype}</Typography>
              <Typography variant="body1"><strong>Check-In Date:</strong> {new Date(reservation.reservation.check_in).toLocaleDateString()}</Typography>
              <Typography variant="body1"><strong>Check-Out Date:</strong> {new Date(reservation.reservation.check_out).toLocaleDateString()}</Typography>
              <Typography variant="body1"><strong>Total Amount:</strong> ${reservation.reservation.total_amount}</Typography>
            </Paper>
          </animated.div>
        </Grid>

        {/* Proof Documents */}
        <Grid item xs={12}>
          <animated.div style={animatedProps}>
            <Paper elevation={3} style={{ padding: "20px" }}>
              <Typography variant="h5">Proof Documents</Typography>
              {reservation.guests.proofDocument && reservation.guests.proofDocument.map((doc, index) => (
                <Box key={index} mb={2}>
                    
                  <Avatar src={`http://localhost:5174/profdocs/${doc}`} alt={`Document ${index + 1}`} style={{ width: "100px", height: "100px" }} />
                  <Button variant="contained" color="primary" startIcon={<DescriptionIcon />} style={{ marginTop: "10px" }}>
                    View Document
                  </Button>
                </Box>
              ))}
            </Paper>
          </animated.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReservationDetails;
