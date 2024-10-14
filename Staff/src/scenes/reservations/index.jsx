import { Box, useTheme, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Header } from "../../components";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from "react-router-dom";

const Reservation = () => {
  useAuth();
  const theme = useTheme();
  const [rdetails, setRdetails] = useState([]);
  const navigate = useNavigate();
  const resdetails = () => {
    axios.post('http://localhost:3001/resdetails')
      .then(res => {
        setRdetails(res.data);
      })
      .catch(err => console.log(err));
  };

  const handleCancellation = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to cancel the reservation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('http://localhost:3001/handleCancellation', { id })
          .then(res => {
            Swal.fire('Cancelled!', res.data, 'success');
            resdetails(); // Refresh reservation details
          })
          .catch(err => {
            Swal.fire('Error!', 'Something went wrong. Please try again.', 'error');
          });
      }
    });
  };

  useEffect(() => {
    resdetails();
  }, []);

  const isCancellationAllowed = (check_in) => {
    const checkInDate = new Date(check_in);
    const currentDate = new Date();
    return currentDate <= checkInDate;
  };

  const handleViewDetails = (reservationId) => {
    navigate(`/dashboard/reservation-details/${reservationId}`);
  };

  return (
    <Box m="20px">
      <Header title="Reservation Details" subtitle="List of Reserved Rooms and their Details" />
      <Table>
        <TableHead sx={{ backgroundColor: '#00A36C' }}>
          <TableRow>
            <TableCell><strong>Guest Name</strong></TableCell>
            <TableCell><strong>Guest Email</strong></TableCell>
            
            <TableCell><strong>Room Number</strong></TableCell>
            <TableCell><strong>Check-In Date</strong></TableCell>
            <TableCell><strong>Check-Out Date</strong></TableCell>
            
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rdetails.map((reservation) => (
            <TableRow key={reservation._id}>
              {/* Check if user and room exist before accessing properties */}
              <TableCell>{reservation.user?.displayName || "N/A"}</TableCell>
              <TableCell>{reservation.user?.email || "N/A"}</TableCell>
              
              <TableCell>{reservation.room?.roomno || "N/A"}</TableCell>
              <TableCell>{new Date(reservation.check_in).toLocaleDateString("en-GB")}</TableCell>
              <TableCell>{new Date(reservation.check_out).toLocaleDateString("en-GB")}</TableCell>
              
              <TableCell>
  <Typography
    variant="body2"
    style={{
      color: reservation.status === "Cancelled" ? "red" : "green",
    }}
  >
    {reservation.status === "checked_in" ? "Check-in Completed" : reservation.status}
  </Typography>
</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => reservation.status === "reserved" && isCancellationAllowed(reservation.check_in) ? handleCancellation(reservation._id) : null}
                  style={{
                    backgroundColor: reservation.status === "reserved" ? "red" : "#ff6666",
                    cursor: reservation.status === "reserved" && isCancellationAllowed(reservation.check_in) ? "pointer" : "not-allowed",
                  }}
                  disabled={reservation.status !== "reserved" || !isCancellationAllowed(reservation.check_in)} // Disable if not reserved or cancellation is not allowed
                >
                  {reservation.status === "Cancelled" ? "Cancelled" : "Cancel"}
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewDetails(reservation._id)}
                  style={{ marginLeft: "10px", marginTop: "5px" }}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default Reservation;
