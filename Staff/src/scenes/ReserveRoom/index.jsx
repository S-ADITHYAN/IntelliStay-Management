import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import axios from "axios";
import { Box, Button, MenuItem, TextField, Typography, Grid } from "@mui/material";
import { useNavigate } from 'react-router-dom';

const ReserveRoom = () => {
  const navigate = useNavigate();
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomRate, setRoomRate] = useState(0);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const userId = "user123"; // Example user ID

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get("http://localhost:3001/staff/rooms/types");
        setRoomTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch room types", error);
      }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (selectedRoomType && checkInDate && checkOutDate && adults > 0 && children >= 0) {
        try {
          const response = await axios.get("http://localhost:3001/staff/rooms/available", {
            params: {
              roomType: selectedRoomType,
              checkInDate,
              checkOutDate,
              adults,
              children,
            },
          });

          const { availableRooms, roomsNeeded, roomsAvailable } = response.data;
          if (roomsAvailable < roomsNeeded) {
            Swal.fire("Not enough rooms available", "Please select a different date or room type.", "warning");
          } else {
            setAvailableRooms(availableRooms);
          }
        } catch (error) {
          console.error("Failed to fetch available rooms", error);
        }
      }
    };

    fetchAvailableRooms();
  }, [selectedRoomType, checkInDate, checkOutDate, adults, children]);

  // Calculate total days and total amount when relevant state changes
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRoom) {
      const totalDay = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)); // Calculate total days
      setTotalDays(totalDay);
      const totalAmt = totalDay * roomRate; // Calculate total amount
      setTotalAmount(totalAmt);
    }
  }, [checkInDate, checkOutDate, selectedRoom, roomRate]);

  const handleRoomSelection = (room) => {
    setSelectedRoom(room);
    setRoomRate(room.rate); // Update roomRate when a room is selected
  };

  const handleAddGuestDetails = () => {
    console.log(adults)
    if (!selectedRoomType || !selectedRoom || !checkInDate || !checkOutDate) {
      Swal.fire("Incomplete Information", "Please fill all the required fields before proceeding.", "warning");
      return;
    }

    Swal.fire("Proceed to Add Guest Details", "You can now add guest details.", "info");

    // const reservationData = {
    //   adults: adults,
    //   children: children,
    //   roomdata: selectedRoom,
    //   totlrate: totalAmount,
    //   totldays: totalDays,
    //   checkInDate: checkInDate,
    //   checkOutDate: checkOutDate,
    // };

    // Navigate to GuestDetails component and pass data
    navigate('/dashboard/guestdetails', { state:{
      adult: adults,
      children: children,
      roomdata: selectedRoom,
      totlrate: totalAmount,
      totldays: totalDays,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
  }});
  };

  return (
    <Box>
      <Typography variant="h4">Reserve a Room</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DatePicker
            selected={checkInDate}
            onChange={(date) => setCheckInDate(date)}
            placeholderText="Check-In Date"
            dateFormat="yyyy/MM/dd"
            isClearable
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DatePicker
            selected={checkOutDate}
            onChange={(date) => setCheckOutDate(date)}
            placeholderText="Check-Out Date"
            dateFormat="yyyy/MM/dd"
            isClearable
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            label="Room Type"
            fullWidth
            value={selectedRoomType}
            onChange={(e) => setSelectedRoomType(e.target.value)}
          >
            {roomTypes.map((roomType) => (
              <MenuItem key={roomType} value={roomType}>
                {roomType}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            label="Select Room"
            fullWidth
            value={selectedRoom ? selectedRoom.roomno : ""}
            onChange={(e) => {
              const room = availableRooms.find((r) => r.roomno === e.target.value);
              handleRoomSelection(room);
            }}
            disabled={!availableRooms.length}
          >
            {availableRooms.map((room) => (
              <MenuItem key={room._id} value={room.roomno}>
                {room.roomno} - {room.roomNumber} - {room.rate} per night
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Adults"
            type="number"
            value={adults}
            onChange={(e) => setAdults(Math.max(1, e.target.value))}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Children"
            type="number"
            value={children}
            onChange={(e) => setChildren(Math.max(0, e.target.value))}
            inputProps={{ min: 0 }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Room Rate: {roomRate} per night</Typography>
          <Typography variant="h6">Total Days: {totalDays}</Typography>
          <Typography variant="h6">Total Amount: {totalAmount}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="success" onClick={handleAddGuestDetails}>
            Add Guest Details
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReserveRoom;
