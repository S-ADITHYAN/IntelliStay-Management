import React, { useState, useEffect } from "react";
import { Box, Button, Typography, useTheme, Modal } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import axios from "axios";
import useAuth from "../../useAuth";
import { jwtDecode } from "jwt-decode";
import { tokens } from "../../theme";
import { Header } from "../../components";

const ViewLeaveStatus = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [userData, setUserData] = useState(null);
  const [leaveDetails, setLeaveDetails] = useState([]);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);

  // Fetch leave details for the logged-in user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken);

        axios.post(`http://localhost:3001/leaveDetails/${decodedToken._id}`)
          .then((res) => setLeaveDetails(res.data))
          .catch((err) => console.error(err));
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  const fetchLeaveDetail = (leaveId) => {
    axios.get(`http://localhost:3001/leaveDetail/${leaveId}`)
      .then((res) => {
        setSelectedLeaveDetail(res.data);
        setOpenDetailModal(true);
      })
      .catch((err) => console.error(err));
  };

  const columns = [
    { field: "_id", headerName: "Leave ID", flex: 0.5 },
    { field: "leaveType", headerName: "Leave Type", flex: 0.5 },
    { field: "startDate", headerName: "Start Date", flex: 0.5 },
    { field: "endDate", headerName: "End Date", flex: 0.5 },
    { field: "status", headerName: "Status", flex: 0.5 },
    { field: "appliedon", headerName: "Leave Applied on", flex: 0.5},
    { field: "approvedon", headerName: "Leave Approved on", flex: 0.5,valueGetter: (params) => params.row.approvedon || 'Not yet approved' },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap="10px">
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={() => fetchLeaveDetail(params.row._id)}
          >
            View
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Leave Status"
        subtitle="List of Leave Requests"
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
        }}
      >
        <DataGrid
          rows={leaveDetails}
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
        />
      </Box>

      {/* Modal for Viewing Leave Details */}
      <Modal open={openDetailModal} onClose={() => setOpenDetailModal(false)}>
        <Box
          p={3}
          m="20px auto"
          width="50%"
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? "#333" : "#f9f9f9",
            color: theme.palette.mode === 'dark' ? "#fff" : "#000",
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Leave Details
          </Typography>
          {selectedLeaveDetail && (
            <Box>
              <Typography><strong>Leave ID:</strong> {selectedLeaveDetail._id}</Typography>
              <Typography><strong>Employee Name:</strong> {selectedLeaveDetail.employeeName}</Typography>
              <Typography><strong>Leave Type:</strong> {selectedLeaveDetail.leaveType}</Typography>
              <Typography><strong>Start Date:</strong> {selectedLeaveDetail.startDate}</Typography>
              <Typography><strong>End Date:</strong> {selectedLeaveDetail.endDate}</Typography>
              <Typography><strong>Status:</strong> {selectedLeaveDetail.status}</Typography>
              <Typography><strong>Leave Applied on:</strong> {selectedLeaveDetail.appliedon}</Typography>
              <Typography><strong>Leave Approved on:</strong> {selectedLeaveDetail.approvedon ? selectedLeaveDetail.approvedon :'not yet approved '}</Typography>
            </Box>
          )}
          <Box mt={2}>
            <Button variant="outlined" color="secondary" onClick={() => setOpenDetailModal(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ViewLeaveStatus;
