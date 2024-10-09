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
          <TableHead>
            <TableRow>
              <TableCell>Guest Name</TableCell>
              <TableCell>Guest Email</TableCell>
              <TableCell>Guest Phno</TableCell>
              <TableCell>Room Number</TableCell>
              <TableCell>Check-In Date</TableCell>
              <TableCell>Check-Out Date</TableCell>
              <TableCell>Check-In Time</TableCell>
              <TableCell>Check-In Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>{reservation.guestName}</TableCell>
                <TableCell>{reservation.guestemail}</TableCell>
                <TableCell>{reservation.guestphno}</TableCell>
                <TableCell>{reservation.roomNumber}</TableCell>
                <TableCell>{new Date(reservation.checkInDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(reservation.checkOutDate).toLocaleDateString()}</TableCell>
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
                        color="primary"
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
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDetails(reservation._id)}
                    style={{ marginLeft: "10px" }}
                    onMouseEnter={(e) => {
                      const tooltip = document.createElement("div");
                      tooltip.className = "tooltip";
                      tooltip.innerText = "View Details";
                      e.currentTarget.appendChild(tooltip);
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.currentTarget.querySelector(".tooltip");
                      if (tooltip) tooltip.remove();
                    }}
                  >
                    View More Details
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
