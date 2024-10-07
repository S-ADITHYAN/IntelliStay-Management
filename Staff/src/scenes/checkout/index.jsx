import React, { useEffect, useState } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from "@mui/material";
import axios from "axios";

const Checkout = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state to show until data is fetched

  // Fetch today's reservations eligible for checkout
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get("http://localhost:3001/reservations/todays-checkouts");
        setReservations(response.data);
      } catch (error) {
        console.error("Error fetching reservations", error);
      } finally {
        setLoading(false); // Set loading to false when fetch is complete
      }
    };
    fetchReservations();
  }, []);

  // Handle checkout
  const handleCheckout = async (reservationId) => {
    try {
      await axios.put(`http://localhost:3001/reservations/checkout/${reservationId}`);
      setReservations((prevState) =>
        prevState.map((reservation) =>
          reservation._id === reservationId
            ? { ...reservation, status: "checked_out", checkoutTime: new Date() }
            : reservation
        )
      );
    } catch (error) {
      console.error("Error during checkout", error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        Today's Checkouts
      </Typography>

      {loading ? (
        <Typography variant="body1">Loading...</Typography> // Show loading message while data is being fetched
      ) : reservations.length === 0 ? (
        <Typography variant="body1">No reservations for checkout today.</Typography> // Show message if no reservations
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Guest Name</TableCell>
              <TableCell>Guest Email</TableCell>
              <TableCell>Guest Phone</TableCell>
              <TableCell>Room Number</TableCell>
              <TableCell>Check-Out Date</TableCell>
              <TableCell>Check-Out Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>{reservation.guestName}</TableCell>
                <TableCell>{reservation.guestEmail}</TableCell>
                <TableCell>{reservation.guestPhone}</TableCell>
                <TableCell>{reservation.roomNumber}</TableCell>
                <TableCell>{new Date(reservation.checkOutDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {reservation.checkoutTime ? new Date(reservation.checkoutTime).toLocaleString() : "N/A"}
                </TableCell>
                <TableCell>
                  {reservation.status === "checked_out" ? (
                    <Typography variant="body2" color="green">
                      Checkout Completed
                    </Typography>
                  ) : (
                    reservation.status
                  )}
                </TableCell>
                <TableCell>
                  {reservation.status !== "checked_out" && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleCheckout(reservation._id)}
                    >
                      Checkout
                    </Button>
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

export default Checkout;
