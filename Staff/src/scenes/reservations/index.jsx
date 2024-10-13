import { Box, useTheme, Button } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";

const Reservation = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [rdetails, setRdetails] = useState([]);

  const resdetails = () => {
    axios.post('http://localhost:3001/resdetails')
      .then(res => {
        console.log(res.data);
        setRdetails(res.data);
      })
      .catch(err => console.log(err));
  };

  const handleCancellation = (id) => {
    // Display confirmation dialog
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
        // Call the cancellation API only if user confirms
        axios.post('http://localhost:3001/handleCancellation', { id })
          .then(res => {
            Swal.fire('Cancelled!', res.data, 'success');
            resdetails(); // Refresh the reservation details after cancellation
          })
          .catch(err => {
            Swal.fire('Error!', 'Something went wrong. Please try again.', 'error');
            console.log(err);
          });
      }
    });
  };

  useEffect(() => {
    resdetails();
  }, []);

  const columns = [
    { field: "_id", headerName: "Reservation ID", flex: 0.5 },
    { field: "user.email", headerName: "User Email", flex: 1 }, // Accessing user email
    { field: "room.roomno", headerName: "Room Name", flex: 1 }, // Accessing room name
    {
      field: "check_in",
      headerName: "Check-in Date",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "check_out",
      headerName: "Check-out Date",
      flex: 1,
    },
    {
      field: "booking_date",
      headerName: "Booking Date",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    {
      field: "total_amount",
      headerName: "Total Amount",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => {
        const checkInDate = new Date(params.row.check_in);
        const currentDate = new Date();
        
        // Check if cancellation is allowed
        const isCancellationAllowed = currentDate <= checkInDate;

        return (
          <Box display="flex" gap="10px">
            <Button
              variant="contained"
              size="small"
              onClick={() => 
                params.row.status === "reserved" && isCancellationAllowed ? handleCancellation(params.row._id) : null
              }
              style={{
                backgroundColor: params.row.status === "reserved" ? "red" : "#ff6666",
                cursor: params.row.status === "reserved" && isCancellationAllowed ? "pointer" : "not-allowed",
              }}
              disabled={params.row.status !== "reserved" || !isCancellationAllowed} // Disable if not reserved or cancellation is not allowed
            >
              {params.row.status === "Cancelled" ? "Cancelled" : "Cancel"}
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Reservation Details"
        subtitle="List of Reserved Rooms and their Details"
      />
      <Box
        mt="40px"
        height="75vh"
        maxWidth="100%"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            border: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[500],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[500],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-iconSeparator": {
            color: colors.primary[100],
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.gray[300]} !important`,
          },
        }}
      >
        <DataGrid
          rows={rdetails}
          columns={columns}
          getRowId={(row) => row._id}
          components={{ Toolbar: GridToolbar }}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          checkboxSelection
        />
      </Box>
    </Box>
  );
};

export default Reservation;
