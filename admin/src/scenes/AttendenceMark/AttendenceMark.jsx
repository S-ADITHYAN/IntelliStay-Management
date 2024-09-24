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
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);

  // Fetch all staff members and today's attendance on component mount
  useEffect(() => {
    // Fetch staff list
    axios.post('http://localhost:3001/staffdetails')
      .then(response => setStaffList(response.data))
      .catch(error => console.error('Error fetching staff list', error));

    // Check if today's attendance is marked
    axios.post('http://localhost:3001/attendance/today')
      .then(response => {
        if (response.data.length > 0) {
          console.log(response.data)
          setIsAttendanceMarked(true);
        }
      })
      .catch(error => console.error('Error checking attendance', error));
  }, []);

  // Handle checkbox change for marking attendance
  const handleAttendanceChange = (staffId, isPresent) => {
    setAttendance({
      ...attendance,
      [staffId]: isPresent,
    });
  };

  // Submit the attendance to the backend
//   
  // Submit the attendance to the backend
  const submitAttendance = () => {

    console.log(attendance)
    axios.post('http://localhost:3001/attendance/mark', attendance)
      .then(() => {
        Swal.fire('Success!','Attendance marked successfully!','succes');
      })
      .catch(error => console.error('Error submitting attendance', error));
  };

  const columns = [
    { field: 'displayName', headerName: 'Staff Name', flex: 1 },
    { field: 'email', headerName: 'Staff Email', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    {
      field: 'attendance',
      headerName: 'Present',
      flex: 1,
      renderCell: (params) => (
        <input
          type="checkbox"
          checked={attendance[params.row._id] || false}
          disabled={isAttendanceMarked} // Disable if attendance is already marked
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
        disabled={isAttendanceMarked} // Disable button if already marked
        style={{ marginTop: '20px' }}
      >
        {isAttendanceMarked ? 'Attendance Marked' : 'Submit Attendance'}
      </Button>
    </Box>
  );
};

export default AttendanceMark;
