import React, { useEffect, useState } from "react";
import {
  Box,
  useTheme,
  Button,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import Swal from "sweetalert2";
import { tokens } from "../../theme";
import useAuth from "../../useAuth";

const ViewLeaveApplications = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [applications, setApplications] = useState([]);

  // Fetch leave applications
  const fetchLeaveApplications = () => {
    axios
      .get("http://localhost:3001/leave-applications")
      .then((res) => {
        setApplications(res.data);
      })
      .catch((err) => console.log(err));
  };

  // Handle accepting a leave application
  const handleAccept = (id) => {
    axios
      .post(`http://localhost:3001/leave-applications/accept/${id}`)
      .then(() => {
        Swal.fire("Success!", "Leave application accepted.", "success");
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, status: 'Accepted' } : app
          )
        );
      })
      .catch((err) => console.log(err));
  };

  // Handle rejecting a leave application
  const handleReject = (id) => {
    axios
      .post(`http://localhost:3001/leave-applications/reject/${id}`)
      .then(() => {
        Swal.fire("Oops!", "Leave application rejected.", "error");
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, status: 'Rejected' } : app
          )
        );
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchLeaveApplications();
  }, []);

  const columns = [
    { field: "name", headerName: "Staff Name", flex: 0.1 },
    { field: "leaveType", headerName: "Leave Type", flex: 0.1 },
    { field: "startDate", headerName: "Start Date", flex: 0.1, valueFormatter: ({ value }) => new Date(value).toLocaleDateString() },
    { field: "endDate", headerName: "End Date", flex: 0.1, valueFormatter: ({ value }) => new Date(value).toLocaleDateString() },
    { field: "reason", headerName: "Reason", flex: 0.1 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.1,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.1,
      renderCell: (params) => (
        <Box>
          {params.row.status === 'Pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleAccept(params.row._id)}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleReject(params.row._id)}
                sx={{ ml: 1 }}
              >
                Reject
              </Button>
            </>
          )}
          {params.row.status === 'Accepted' && (
            <Button variant="contained" color="success" disabled>
              Accepted
            </Button>
          )}
          {params.row.status === 'Rejected' && (
            <Button variant="contained" color="error" disabled>
              Rejected
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Typography variant="h4" gutterBottom>
        Leave Applications
      </Typography>
      <Box
        mt="40px"
        height="75vh"
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
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[500],
          },
        }}
      >
        <DataGrid
          rows={applications}
          columns={columns}
          getRowId={(row) => row._id}
          components={{ Toolbar: GridToolbar }}
          checkboxSelection
        />
      </Box>
    </Box>
  );
};

export default ViewLeaveApplications;
