import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import axios from 'axios';
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

const AttendanceMark = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState({});

  // Fetch all staff members on component mount
  useEffect(() => {
    axios.post('http://localhost:3001/staffdetails')
      .then(response => setStaffList(response.data))
      .catch(error => console.error('Error fetching staff list', error));
  }, []);

  // Handle checkbox change for marking attendance
  const handleAttendanceChange = (staffId, isPresent) => {
    setAttendance({
      ...attendance,
      [staffId]: isPresent,
    });
  };

  // Submit the attendance to the backend
  const submitAttendance = () => {
    console.log(attendance)
    axios.post('http://localhost:3001/attendance/mark', attendance)
      .then(() => {
        Swal.fire('Attendance marked successfully!');
      })
      .catch(error => console.error('Error submitting attendance', error));
  };

  const columns = [
    { field: 'displayName', headerName: 'Staff Name', flex: 1 },
    { field: 'email', headerName: 'Staff Email_Id', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    {
      field: 'attendance',
      headerName: 'Present',
      flex: 1,
      renderCell: (params) => (
        <input
          type="checkbox"
          checked={attendance[params.row._id] || false}
          onChange={(e) => handleAttendanceChange(params.row._id, e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Box m="20px">
      <Typography variant="h4" mb="20px">Mark Attendance</Typography>
      <Box
        mt="40px"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
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
        }}
      >
        <DataGrid
          rows={staffList}
          columns={columns}
          getRowId={(row) => row._id}
          checkboxSelection
        />
      </Box>
      <Button 
        variant="contained" 
        color="success" 
        onClick={submitAttendance} 
        style={{ marginTop: '20px' }}
      >
        Submit Attendance
      </Button>
    </Box>
  );
};

export default AttendanceMark;
