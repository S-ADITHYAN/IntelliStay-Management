import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Button, Avatar, Modal, IconButton } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import RoomIcon from "@mui/icons-material/Room";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";  // Import the CloseIcon
import { useSpring, animated } from "react-spring";

const ReservationDetails = () => {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [open, setOpen] = useState(false); // State for opening and closing modal
  const [currentDocument, setCurrentDocument] = useState(null); // State for storing the current document

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

  // Animation for modal opening and closing
  const modalAnimation = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? "scale(1)" : "scale(0.8)",
    config: { tension: 300, friction: 25 },
  });

  // Handler to open modal
  const handleOpenModal = (document) => {
    setCurrentDocument(document); // Set the current document
    setOpen(true); // Open the modal
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setOpen(false); // Close the modal
  };

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
          <Paper elevation={3} style={{ padding: "20px" ,backgroundColor: "#FFD180" }}>
            <Typography variant="h5">Guest Information</Typography>
            {reservation.guests.map((guest, index) => (
              <div key={index}>
                <Typography variant="body1">
                  <strong>Name:</strong> {guest.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {guest.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {guest.phone}
                </Typography>
                <Typography variant="body1">
                  <strong>Address:</strong> {guest.address}
                </Typography>
                <Typography variant="body1">
                  <strong>Dob:</strong> {new Date(guest.dob).toLocaleDateString('en-GB')}

                </Typography>
                <Typography variant="body1">
                  <strong>ProofType:</strong> {guest.proofType}
                </Typography>
                <Typography variant="body1">
                  <strong>ProofNumber:</strong> {guest.proofNumber}
                </Typography>
              </div>
            ))}
          </Paper>
        </Grid>

        {/* Room Information */}
        <Grid item xs={12} md={6}>
          <animated.div>
            <Paper elevation={3} style={{ padding: "20px" ,backgroundColor: "#FFD180" }}>
              <Typography variant="h5">Room Information</Typography>
              <Typography variant="body1">
                <RoomIcon /> Room Number: {reservation.room.roomno}
              </Typography>
              <Typography variant="body1">
                <strong>Room Type:</strong> {reservation.room.roomtype}
              </Typography>
              <Typography variant="body1">
                <strong>Check-In Date:</strong>{" "}
                {new Date(reservation.reservation.check_in).toLocaleDateString('en-GB')}
              </Typography>
              <Typography variant="body1">
                <strong>Check-Out Date:</strong>{" "}
                {new Date(reservation.reservation.check_out).toLocaleDateString('en-GB')}
              </Typography>
              <Typography variant="body1">
                <strong>Total Amount:</strong> ${reservation.reservation.total_amount}
              </Typography>
            </Paper>
          </animated.div>
        </Grid>

        {/* Proof Documents */}
        <Grid item xs={12}>
          <animated.div>
            <Paper elevation={3} style={{ padding: "20px",backgroundColor: "#FFD180" }}>
              <Typography variant="h5">Proof Documents</Typography>
              {reservation.guests.map((guest, guestIndex) => (
                <div key={guestIndex}>
                  {/* Guest Name Heading */}
                  <Typography variant="h6" gutterBottom>
                    {guest.name}'s Documents
                  </Typography>

                  {/* Guest Proof Documents */}
                  {guest.proofDocument && guest.proofDocument.length > 0 ? (
                    <Box key={guest._id} mb={2}>
                      <Avatar
                        src={`http://localhost:3001/profdocs/${guest.proofDocument}`}
                        alt={`Document ${guest._id + 1}`}
                        style={{ width: "100px", height: "100px", cursor: "pointer" }}
                        onClick={() => handleOpenModal(guest.proofDocument)}
                      />
                      {/* <Button
                        variant="contained"
                        color="primary"
                        startIcon={<DescriptionIcon />}
                        style={{ marginTop: "10px" }}
                        onClick={() => handleOpenModal(guest.proofDocument)} // Open modal on click
                      >
                        View Document
                      </Button> */}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No proof documents available for this guest.
                    </Typography>
                  )}
                </div>
              ))}
            </Paper>
          </animated.div>
        </Grid>
      </Grid>

      {/* Modal for viewing document */}
      <Modal open={open} onClose={handleCloseModal} closeAfterTransition>
        <animated.div
          style={{
            ...modalAnimation,
            position: "relative",
            outline: "none",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleCloseModal}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              color: "white",
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Proof Document */}
          <img
            src={`http://localhost:3001/profdocs/${currentDocument}`}
            alt="Proof Document"
            style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: "10px" }}
          />
        </animated.div>
      </Modal>
    </Box>
  );
};

export default ReservationDetails;
