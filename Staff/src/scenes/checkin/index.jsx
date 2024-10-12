import React, { useEffect, useState } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VisibilityIcon from '@mui/icons-material/Visibility';


const CheckIn = () => {
  const [reservations, setReservations] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // useNavigate for routing

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get("http://localhost:3001/reservations/todays-reservations");
        setReservations(response.data);
      } catch (error) {
        console.error("Error fetching reservations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  const handleVerify = async (reservationId) => {
    try {
      await axios.put(`http://localhost:3001/reservations/verify/${reservationId}`);
      setVerifyStatus((prevState) => ({
        ...prevState,
        [reservationId]: true,
      }));
    } catch (error) {
      console.error("Error verifying reservation", error);
    }
  };

  const handleCheckIn = async (reservationId) => {
    try {
      await axios.put(`http://localhost:3001/reservations/checkin/${reservationId}`);
      setReservations((prevState) =>
        prevState.map((reservation) =>
          reservation._id === reservationId
            ? { ...reservation, status: "checked_in", checkInTime: new Date() }
            : reservation
        )
      );
    } catch (error) {
      console.error("Error during check-in", error);
    }
  };

  const handleViewDetails = (reservationId) => {
    navigate(`/dashboard/reservation-details/${reservationId}`); // Navigate to details page
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        Today's Reservations
      </Typography>

      {loading ? (
        <Typography variant="body1">Loading...</Typography>
      ) : reservations.length === 0 ? (
        <Typography variant="body1">No reservations for today.</Typography>
      ) : (
        <Table>
          <TableHead sx={{ backgroundColor: '#00A36C' }}>
            <TableRow>
              <TableCell><strong>Guest Name </strong></TableCell>
              <TableCell><strong>Guest Email </strong></TableCell>
              <TableCell><strong>Guest Phno</strong></TableCell>
              <TableCell><strong>Room Number</strong></TableCell>
              <TableCell><strong>Check-In Date</strong></TableCell>
              <TableCell><strong>Check-Out Date</strong></TableCell>
              <TableCell><strong>Check-In Time</strong></TableCell>
              <TableCell><strong>Check-In Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>{reservation.guestName}</TableCell>
                <TableCell>{reservation.guestemail}</TableCell>
                <TableCell>{reservation.guestphno}</TableCell>
                <TableCell>{reservation.roomNumber}</TableCell>
                <TableCell>{new Date(reservation.checkInDate).toLocaleDateString("en-GB")}</TableCell>
                <TableCell>{new Date(reservation.checkOutDate).toLocaleDateString("en-GB")}</TableCell>
                <TableCell>{new Date(reservation.check_in_time).toLocaleTimeString()}</TableCell>
                <TableCell>
                  {reservation.status === "checked_in" ? (
                    <Typography variant="body2" color="green">
                      Check-in Completed
                    </Typography>
                  ) : (
                    reservation.status
                  )}
                </TableCell>
                <TableCell>
                  {reservation.status !== "checked_in" && (
                    <>
                      <Button
                        variant="contained"
                        color="#0096FF"
                        onClick={() => handleVerify(reservation._id)}
                        disabled={verifyStatus[reservation._id]}
                      >
                        {verifyStatus[reservation._id] ? "Verified" : "Verify"}
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleCheckIn(reservation._id)}
                        disabled={!verifyStatus[reservation._id]}
                        style={{ marginLeft: "10px" }}
                      >
                        Check In
                      </Button>
                    </>
                  )}
                  <Button
                   variant="contained"
                   color="secondary"
                   startIcon={<VisibilityIcon />}
                   onClick={(e) => {
                     // Handle the button click action
                     handleViewDetails(reservation._id);
                 
                     // Remove tooltip if it exists
                     const tooltip = document.querySelector(".tooltip");
                     if (tooltip) {
                       tooltip.remove(); // Remove tooltip on click
                     }
                   }}
                   style={{ marginLeft: "10px" ,marginTop: "5px"}}
                   onMouseEnter={(e) => {
                     const tooltip = document.createElement("div");
                     tooltip.className = "tooltip";
                     tooltip.innerText = "View Details";
                 
                     // Calculate the position of the button to position the tooltip above it
                     const buttonRect = e.currentTarget.getBoundingClientRect();
                 
                     // Apply styles directly
                     tooltip.style.position = "absolute";
                     tooltip.style.top = `${buttonRect.top - 30}px`; // 30px above the button
                     tooltip.style.left = `${buttonRect.left + buttonRect.width / 2}px`; // Center tooltip horizontally
                     tooltip.style.transform = "translateX(-50%)"; // Adjust to make it centered
                     tooltip.style.backgroundColor = "#FFFDD0"; // Cream color
                     tooltip.style.color = "black"; // Text color
                     tooltip.style.padding = "5px 10px"; // Padding
                     tooltip.style.borderRadius = "4px"; // Rounded corners
                     tooltip.style.whiteSpace = "nowrap"; // Prevent text wrapping
                     tooltip.style.zIndex = "9999"; // Make sure it’s on top
                     tooltip.style.fontSize = "12px"; // Font size
                     tooltip.style.pointerEvents = "none"; // So it doesn’t interfere with other events
                     tooltip.style.boxShadow = "0px 2px 10px rgba(0, 0, 0, 0.1)"; // Optional shadow
                     tooltip.style.opacity = "0"; // Initial opacity for transition
                     tooltip.style.transition = "opacity 0.2s ease-in-out"; // Smooth fade-in
                     document.body.appendChild(tooltip); // Append to the body
                 
                     // Make tooltip visible after appending
                     setTimeout(() => {
                       tooltip.style.opacity = "1"; // Fade-in effect
                     }, 0);
                   }}
                   onMouseLeave={() => {
                     const tooltip = document.querySelector(".tooltip");
                     if (tooltip) {
                       tooltip.style.opacity = "0"; // Fade out before removing
                       setTimeout(() => {
                         if (tooltip) tooltip.remove();
                       }, 200); // Give time for fade-out transition
                     }
                   }}
                 
                  
                  >
                    
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default CheckIn;
