import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Typography,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import useAuth from "../../useAuth";

const CheckIn = () => {
  useAuth();
  const [reservations, setReservations] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // useNavigate for routing

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/reservations/todays-reservations"
        );
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
      await axios.put(
        `http://localhost:3001/reservations/verify/${reservationId}`
      );
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
      await axios.put(
        `http://localhost:3001/reservations/checkin/${reservationId}`
      );
      setReservations((prevState) =>
        prevState.map((reservation) =>
          reservation._id === reservationId
            ? {
                ...reservation,
                status: "checked_in",
                checkInTime: new Date(),
              }
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
          <TableHead sx={{ backgroundColor: "#00A36C" }}>
            <TableRow>
              <TableCell>
                <strong>Guest Name </strong>
              </TableCell>
              <TableCell>
                <strong>Guest Email </strong>
              </TableCell>
              {/* <TableCell>
                <strong>Guest Phno</strong>
              </TableCell> */}
              <TableCell>
                <strong>Room Number</strong>
              </TableCell>
              <TableCell>
                <strong>Check-In Date</strong>
              </TableCell>
              <TableCell>
                <strong>Check-Out Date</strong>
              </TableCell>
              <TableCell>
                <strong>Check-In Time</strong>
              </TableCell>
              <TableCell>
                <strong>Check-In Status</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>{reservation.guestName}</TableCell>
                <TableCell>{reservation.guestemail}</TableCell>
                {/* <TableCell>{reservation.guestphno}</TableCell> */}
                <TableCell>{reservation.roomNumber}</TableCell>
                <TableCell>
                  {new Date(reservation.checkInDate).toLocaleDateString(
                    "en-GB"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(reservation.checkOutDate).toLocaleDateString(
                    "en-GB"
                  )}
                </TableCell>
                <TableCell>
                  {reservation.check_in_time
                    ? new Date(reservation.check_in_time).toLocaleTimeString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {reservation.status === "checked_in" ? (
                    <Typography variant="body2" color="green">
                      Check-in Completed
                    </Typography>
                  ) : (
                    reservation.status || "Not Checked In"
                  )}
                </TableCell>
                <TableCell>
                  {reservation.status !== "checked_in" && (
                    <>
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: "#0096FF" }}
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
                        sx={{ marginLeft: "10px" }}
                      >
                        Check In
                      </Button>
                    </>
                  )}
                  <Tooltip title="View Details">
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(reservation._id)}
                      sx={{ marginLeft: "10px", marginTop: "5px" }}
                    />
                  </Tooltip>
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
