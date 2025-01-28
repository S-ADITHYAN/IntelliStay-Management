import { Box, Button, Typography, useTheme } from "@mui/material";
import { Header } from "../../components";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import axios from 'axios';
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import EditRoom from './EditRoom';  // Import the EditRoom component
import useAuth from "../../useAuth";

const Showroom = () => {
  useAuth();
  const [roomdetails, setRoomdetails] = useState([]);
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false); // State to control the overlay visibility
  const [editRoomData, setEditRoomData] = useState(null); // State to hold the data of the room being edited

  const showr = () => {
    axios.post(`${import.meta.env.VITE_API}/admin/roomdetails`)
      .then(res => {
        setRoomdetails(res.data);
      })
      .catch(err => console.log(err));
  };

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleEdit = (id) => {
    // Fetch the room details for the given id
    const roomData = roomdetails.find(room => room._id === id);
    setEditRoomData(roomData);
    setIsEditOverlayOpen(true); // Show the edit overlay
  };

  const handleMaintenance = (id) => {
    axios.post(`${import.meta.env.VITE_API}/admin/handleMaintenance`, { id })
      .then(res => {
        Swal.fire(res.data);
        showr();
      })
      .catch(err => console.log(err));
  };

  const handleAvailable = (id) => {
    axios.post(`${import.meta.env.VITE_API}/admin/handleAvailable`, { id })
      .then(res => {
        Swal.fire(res.data);
        showr();
      })
      .catch(err => console.log(err));
  };

  const handleUpdateComplete = () => {
    setIsEditOverlayOpen(false); // Close the overlay after updating
    showr(); // Refresh the room list
  };

  useEffect(() => {
    showr();
  }, []);

  const columns = [
    { field: "roomno", headerName: "Room No" },
    {
      field: "roomtype",
      headerName: "Room Type",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "left",
      align: "left",
    },
    { field: "rate", headerName: "Room Rate", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "images", headerName: "images", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap="10px">
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row._id)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => params.row.status === "maintenance" 
              ? handleAvailable(params.row._id) 
              : handleMaintenance(params.row._id) 
            }
          >
            {params.row.status === "maintenance" ? "Available" : "Maintenance"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Rooms" subtitle="Room Details" />
      <Box
        mt="40px"
        height="75vh"
        flex={1}
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
            backgroundColor: colors.greenAccent[500],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.greenAccent[500],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-iconSeparator": {
            color: colors.primary[100],
          },
        }}
      >
        <DataGrid
          rows={roomdetails}
          columns={columns}
          getRowId={(row) => row._id}
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
      
      {isEditOverlayOpen && (
        <EditRoom 
          roomData={editRoomData}
          onClose={() => setIsEditOverlayOpen(false)}
          onUpdateComplete={handleUpdateComplete}
        />
      )}
    </Box>
  );
};

export default Showroom;
