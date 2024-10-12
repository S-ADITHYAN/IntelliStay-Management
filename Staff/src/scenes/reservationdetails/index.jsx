import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Button, Avatar, Modal, IconButton } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import RoomIcon from "@mui/icons-material/Room";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import { useSpring, animated } from "react-spring";

const ReservationDetails = () => {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [modalType, setModalType] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // New state for the current image index

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

  const modalAnimation = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? "scale(1)" : "scale(0.8)",
    config: { tension: 300, friction: 25 },
  });

  // Handler to open modal with type
  const handleOpenModal = (content, type) => {
    setCurrentDocument(content);
    setModalType(type);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  // Function to handle image navigation
  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % reservation.room.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + reservation.room.images.length) % reservation.room.images.length);
  };

  if (!reservation) {
    return <Typography>Loading reservation details...</Typography>;
  }

  let adultCount = 0;
  let childCount = 0;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom style={{ fontWeight: "bold" }}>
        Reservation Details
      </Typography>
      <Grid container spacing={3}>
        {/* Guest Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
            <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center" }}>
              Guest Information
            </Typography>
            {reservation.guests.map((guest, index) => {
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
        <Grid item xs={12} md={6}>
          <animated.div>
            <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#FFBF00", color: "#111" }}>
              <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center" }}>Room Information</Typography>
              {/* Room Images Section */}
              {reservation.room.images && reservation.room.images.length > 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" mb={2} mt={2}>
                  <Box position="relative" display="flex" justifyContent="center">
                    <Button onClick={handlePrevImage} style={{ position: "absolute", left: 0 }}>&lt;</Button>
                    <Box
                      component="img"
                      src={`http://localhost:3001/uploads/${reservation.room.images[currentImageIndex]}`}
                      alt={`Room Image ${currentImageIndex + 1}`}
                      style={{
                        width: "500px", // Adjust size as needed
                        height: "300px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        objectFit: "cover",
                      }}
                      onClick={() => handleOpenModal(reservation.room.images[currentImageIndex], "room")}
                    />
                    <Button onClick={handleNextImage} style={{ position: "absolute", right: 0 }}>&gt;</Button>
                  </Box>
                  <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="center" mt={1}>
                    {reservation.room.images.map((image, index) => (
                      <Box key={index} mb={1} mr={1}>
                        <Box
                          component="img"
                          src={`http://localhost:3001/uploads/${image}`}
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
              <Typography variant="body1"><strong>Room Number:</strong> {reservation.room.roomno}</Typography>
              <Typography variant="body1"><strong>Room Type:</strong> {reservation.room.roomtype}</Typography>
              <Typography variant="body1"><strong>Check-In Date:</strong> {new Date(reservation.reservation.check_in).toLocaleDateString("en-GB")}</Typography>
              <Typography variant="body1"><strong>Check-Out Date:</strong> {new Date(reservation.reservation.check_out).toLocaleDateString("en-GB")}</Typography>
              <Typography variant="body1"><strong>Total Amount:</strong> ${reservation.reservation.total_amount}</Typography>
            </Paper>
          </animated.div>
        </Grid>

        {/* Proof Documents */}
        <Grid item xs={12}>
          <animated.div>
            <Paper elevation={3} style={{ padding: "20px", backgroundColor: "#93C572", color: "#111" }}>
              <Typography variant="h5" style={{ fontWeight: "bold" }}>Proof Documents</Typography>
              {reservation.guests.map((guest, guestIndex) => (
                <div key={guestIndex}>
                  <Typography variant="h6" gutterBottom style={{ fontWeight: "bold" }}>{guest.name}'s Documents</Typography>
                  {guest.proofDocument && guest.proofDocument.length > 0 ? (
                    <Box key={guest._id} mb={2}>
                      <Avatar
                        src={`http://localhost:3001/profdocs/${guest.proofDocument}`}
                        alt={`Document ${guest._id + 1}`}
                        style={{ width: "100px", height: "100px", cursor: "pointer" }}
                        onClick={() => handleOpenModal(guest.proofDocument, "document")}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">No proof documents available for this guest.</Typography>
                  )}
                </div>
              ))}
            </Paper>
          </animated.div>
        </Grid>
      </Grid>

      {/* Modal for viewing content */}
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
          <IconButton
            onClick={handleCloseModal}
            style={{ position: "absolute", top: "10px", right: "10px", color: "white" }}
          >
            <CloseIcon />
          </IconButton>

          {/* Render content based on modal type */}
          {modalType === "document" ? (
            <img
              src={`http://localhost:3001/profdocs/${currentDocument}`}
              alt="Proof Document"
              style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: "10px" }}
            />
          ) : (
            <img
              src={`http://localhost:3001/uploads/${currentDocument}`}
              alt="Room Image"
              style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: "10px" }}
            />
          )}
        </animated.div>
      </Modal>
    </Box>
  );
};

export default ReservationDetails;
