import React, { useEffect, useState } from "react";
import {
  Box,
  useTheme,
  Button,
  Typography,
  Modal,
} from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../useAuth";
import { tokens } from "../../theme";

const Viewassignedjobs = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [jobdetails, setjobdetails] = useState([]);
  const [todayJobs, setTodayJobs] = useState([]); // State for today's assigned jobs
  const [selectedJob, setSelectedJob] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const asjobdetails = () => {
    axios
      .post("http://localhost:3001/asjobdetails")
      .then((res) => {
        console.log(res.data);
        setjobdetails(res.data);
      })
      .catch((err) => console.log(err));
  };

  const handleView = (job) => {
    setSelectedJob(job);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedJob(null);
  };

  useEffect(() => {
    asjobdetails();
  }, []);

  useEffect(() => {
    // Filter today's assigned jobs
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaysJobs = jobdetails.filter(job => {
      const taskDate = new Date(job.taskDate);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });

    setTodayJobs(todaysJobs);
  }, [jobdetails]); // Run this effect whenever jobdetails changes

  const columns = [
    { field: "_id", headerName: "Job_ID", flex: 0.5 },
    { field: "roomNo", headerName: "Room no" },
    {
      field: "staffDisplayName",
      headerName: "Staff_Name",
      flex: 0.5,
      cellClassName: "name-column--cell",
    },
    {
      field: "staffEmail",
      headerName: "Staff_Email_Id",
      flex: 0.5,
      cellClassName: "name-column--cell",
    },
    {
      field: "staffRole",
      headerName: "Staff_Role",
      flex: 0.5,
      cellClassName: "name-column--cell",
    },
    {
      field: "taskDescription",
      headerName: "Task_Description",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "taskDate",
      headerName: "Task_Date",
      flex: 0.5,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
    },
    {
      field: "view",
      headerName: "View",
      renderCell: (params) => (
        <Button
          variant="contained"
          onClick={() => handleView(params.row)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Assigned Jobs Details" subtitle="List of Staff's and their Details " />
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
          rows={jobdetails}
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

      {/* Today's Assigned Jobs Table */}
      <Header title="Today's Assigned Jobs" subtitle="List of Jobs Assigned Today" sx={{ mt: 4 }} />
      <Box
        mt="20px"
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
          rows={todayJobs}
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

      {/* Modal for Job Details */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1080, // Increase width
            maxHeight: '80vh', // Optional: Set a maximum height
            overflowY: 'auto', // Optional: Allow scrolling if content overflows
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          {selectedJob && (
            <>
              <Typography id="modal-title" variant="h6" component="h2">
                Job Details
              </Typography>
              <Typography id="modal-description" sx={{ mt: 2 }}>
                <strong>Room No:</strong> {selectedJob.roomNo}
                <br />
                <strong>Task Description:</strong> {selectedJob.taskDescription}
                <br />
                <strong>Task Date:</strong> {selectedJob.taskDate}
                <br />
                <strong>Status:</strong> {selectedJob.status}
                <br />
                <strong>Staff Name:</strong> {selectedJob.staffDisplayName}
                <br />
                <strong>Staff Role:</strong> {selectedJob.staffRole}
                <br />
                <strong>Staff Email:</strong> {selectedJob.staffEmail}
                <br />
                <strong>Maintenance Required:</strong> {selectedJob.maintenanceRequired ? selectedJob.maintenanceRequired : 'Job not completed'}
                <br />
                <strong>Completed At:</strong> {selectedJob.completedAt ? selectedJob.completedAt : 'Job not completed'}
                <br />
                {/* Display Images */}
                {selectedJob.photos && selectedJob.photos.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                    <strong>Images:</strong>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedJob.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3001/cleanedrooms/${photo}`}
                          alt={`Job Image ${index}`}
                          style={{ width: '500px', height: 'auto', borderRadius: '5px' }} // Adjust size as needed
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Typography>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Viewassignedjobs;
