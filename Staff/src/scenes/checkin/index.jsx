import React, { useEffect, useState } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from "@mui/material";
import axios from "axios";

const CheckIn = () => {
  const [reservations, setReservations] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState({}); // Track verification state
  const [loading, setLoading] = useState(true); // Loading state to show until data is fetched

  // Fetch today's reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get("http://localhost:3001/reservations/todays-reservations");
        setReservations(response.data);
      } catch (error) {
        console.error("Error fetching reservations", error);
      } finally {
        setLoading(false); // Set loading to false when fetch is complete
      }
    };
    fetchReservations();
  }, []);

  // Handle verification of a reservation
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

  // Handle check-in
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

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        Today's Reservations
      </Typography>

      {loading ? (
        <Typography variant="body1">Loading...</Typography> // Show loading message while data is being fetched
      ) : reservations.length === 0 ? (
        <Typography variant="body1">No reservations for today.</Typography> // Show message if no reservations
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
                <TableCell>{new Date(reservation.check_in_time).toLocaleDateString()}</TableCell>
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
