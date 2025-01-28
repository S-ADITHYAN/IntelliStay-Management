import React, { useState, useEffect } from "react";
import { Box, Button, Typography, useTheme, Modal, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { DataGrid,GridToolbar } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import axios from "axios";
import useAuth from "../../useAuth";
import {jwtDecode} from "jwt-decode";
import { tokens } from "../../theme";
import { Header } from "../../components";

const Viewjobs = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [userData, setUserData] = useState(null);
  const [jobDetails, setJobDetails] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [maintenanceRequired, setMaintenanceRequired] = useState("no");
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Fetch job details for the logged-in user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken);

        axios.post(`${import.meta.env.VITE_API}/staff/asjobdetails/${decodedToken._id}`)
          .then((res) => setJobDetails(res.data))
          .catch((err) => console.error(err));
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Function to fetch job detail by ID
  const fetchJobDetail = (jobId) => {
    axios.get(`${import.meta.env.VITE_API}/staff/jobdetail/${jobId}`)
      .then((res) => {
        setSelectedJobDetail(res.data);
        setOpenDetailModal(true);
      })
      .catch((err) => console.error(err));
  };

  const handlePickJob = (jobId) => {
    axios.post(`${import.meta.env.VITE_API}/staff/pickJob`, { jobId })
      .then((res) => {
        Swal.fire("Job picked successfully!");
        updateJobDetails();
      })
      .catch((err) => console.error(err));
  };

  const handleCompleteJob = () => {
    if (selectedPhotos.length === 0) {
      Swal.fire("Please upload photos before submitting.");
      return;
    }

    const validExtensions = ["image/jpeg", "image/png", "image/jpg"];
    for (let photo of selectedPhotos) {
      if (!validExtensions.includes(photo.type)) {
        Swal.fire("Only JPG, PNG, and JPEG files are allowed.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("jobId", selectedJobId);
    selectedPhotos.forEach((photo) => {
      formData.append(`photos`, photo);
    });
    formData.append("maintenanceRequired", maintenanceRequired);

    axios.post(`${import.meta.env.VITE_API}/staff/completeJob`, formData)
      .then((res) => {
        Swal.fire("Job completed successfully!");
        setOpenModal(false);
        setSelectedPhotos([]);
        updateJobDetails();
      })
      .catch((err) => console.error(err));
  };

  const updateJobDetails = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      axios.post(`${import.meta.env.VITE_API}/staff/asjobdetails/${decodedToken._id}`)
        .then((res) => setJobDetails(res.data))
        .catch((err) => console.error(err));
    }
  };

  const columns = [
    { field: "_id", headerName: "Job_ID", flex: 0.5 },
    { field: "roomno", headerName: "Room No", flex: 0.5 },
    { field: "task_description", headerName: "Task Description", flex: 1 },
    { field: "task_date", headerName: "Task Date", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "photos", headerName: "Photos", flex: 0.5 },
    { field: "maintenanceRequired", headerName: "Maintenance Required", flex: 0.5 },
    { field: "completedAt", headerName: "Completed At", flex: 0.5 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap="10px">
          {params.row.status === "assigned" && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handlePickJob(params.row._id)}
            >
              Pick the Job
            </Button>
          )}
          {params.row.status === "cleaning in progress" && (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() => {
                setSelectedJobId(params.row._id);
                setOpenModal(true);
              }}
            >
              Finish
            </Button>
          )}
          {params.row.status === "cleaning completed" && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
              >
                Completed
              </Button>
              <Button
                variant="contained"
                color="info"
                size="small"
                onClick={() => fetchJobDetail(params.row._id)}
              >
                View
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Job Details"
        subtitle="List of Job assigned to you "
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
          rows={jobDetails}
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

      {/* Modal for Uploading Photos */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box p={3} m="250px auto" width="50%" sx={{ backgroundColor: theme.palette.mode === 'dark' ? "#333" : "#f9f9f9", color: theme.palette.mode === 'dark' ? "#fff" : "#000", }}>
          <Typography variant="h6" gutterBottom>
            Upload Room Photos
          </Typography>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={(e) => setSelectedPhotos(Array.from(e.target.files))}
          />
          <FormControl component="fieldset" style={{ marginTop: "20px" }}>
            <FormLabel component="legend">Is any maintenance required?</FormLabel>
            <RadioGroup row value={maintenanceRequired} onChange={(e) => setMaintenanceRequired(e.target.value)}>
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleCompleteJob}>
              Submit
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setOpenModal(false)} style={{ marginLeft: "10px" }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal for Viewing Job Details */}
      <Modal open={openDetailModal} onClose={() => setOpenDetailModal(false)}>
  <Box
    p={3}
    m="20px auto"
    width="50%"
    sx={{
      backgroundColor: theme.palette.mode === 'dark' ? "#333" : "#f9f9f9",
      color: theme.palette.mode === 'dark' ? "#fff" : "#000",
      maxHeight: '70vh', // Set a maximum height for the modal
      overflowY: 'auto', // Enable vertical scrolling
    }}
  >
    <Typography variant="h6" gutterBottom>
      Job Details
    </Typography>
    {selectedJobDetail && (
      <Box>
        <Typography><strong>Room No:</strong> {selectedJobDetail.roomno}</Typography>
        <Typography><strong>Task Description:</strong> {selectedJobDetail.task_description}</Typography>
        <Typography><strong>Task Date:</strong> {selectedJobDetail.task_date}</Typography>
        <Typography><strong>Status:</strong> {selectedJobDetail.status}</Typography>
        <Typography><strong>Maintenance Required:</strong> {selectedJobDetail.maintenanceRequired}</Typography>
        <Typography><strong>Completed At:</strong> {selectedJobDetail.completedAt || "N/A"}</Typography>
        {selectedJobDetail.photos && selectedJobDetail.photos.map((photo, index) => (
          <img key={index} src={`${import.meta.env.VITE_API}/cleanedrooms/${photo}`} alt={`Job photo ${index + 1}`} style={{ width: "80%", marginTop: "10px" }} />
        ))}
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

export default Viewjobs;
