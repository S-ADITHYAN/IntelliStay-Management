import { Box, useTheme,Button } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { mockDataContacts } from "../../data/mockData";
import { tokens } from "../../theme";
import { useEffect,useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";
import { differenceInMinutes } from 'date-fns'; 

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
        // Handle maintenance action
        axios.post('http://localhost:3001/handleCancellation',{ id })
          .then(res => {
           
            Swal.fire(res.data);
            resdetails();
          })
          .catch(err => console.log(err));
       
      };

    useEffect(() => {
        resdetails();
      }, []);

      const columns = [
        { field: "_id", headerName: "Reservation_ID", flex: 0.5 },
        { field: "user_id", headerName: "User_ID" },
        {
          field: "room_id",
          headerName: "Room_ID",
          flex: 1,
          cellClassName: "name-column--cell",
        },
        {
          field: "check_in",
          headerName: "Check_in Date",
          headerAlign: "left",
          align: "left",
        },
        {
          field: "check_out",
          headerName: "Check_out Date",
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
            const currentTime = new Date();
            const bookingTime = new Date(params.row.booking_date);
      
            // Calculate the difference in minutes
            const timeDifference = differenceInMinutes(currentTime, bookingTime);
      
            // Enable button if timeDifference is 10 minutes or less
            const canCancel = timeDifference <= 10 && params.row.status === "reserved";
      
            return (
              <Box display="flex" gap="10px">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => canCancel ? handleCancellation(params.row._id) : null}
                  style={{
                    backgroundColor: canCancel ? "red" : "#ff6666",
                    cursor: canCancel ? "pointer" : "not-allowed",
                  }}
                  disabled={!canCancel}
                >
                  {params.row.status === "cancelled" ? "Cancelled" : "Cancel"}
                </Button>
              </Box>
            );
          }
        }
      ];
  return (
    <Box m="20px">
      <Header
        title="Reservation Details"
        subtitle="List of Reserved Rooms and their Details "
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
