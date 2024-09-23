import { Box, Button, Typography, Select, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../useAuth";

const ManualJobAssignment = () => {
    useAuth();
    const [staffList, setStaffList] = useState([]);
    const [roles, setRoles] = useState([]); // To store unique roles
    const [selectedRole, setSelectedRole] = useState('');
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [task, setTask] = useState(''); // To store the task for assignment
    const [jobsAssigned, setJobsAssigned] = useState(false); // Track if jobs are assigned

    useEffect(() => {
        // Fetch staff who are present today
        axios.get('http://localhost:3001/today')
            .then(response => {
                setStaffList(response.data);

                // Extract unique roles
                const uniqueRoles = [...new Set(response.data.map(staff => staff.staffRole))];
                setRoles(uniqueRoles);
            })
            .catch(error => console.error('Error fetching staff attendance', error));
    }, []);

    useEffect(() => {
        // Filter staff based on selected role
        const staffForRole = staffList.filter(staff => staff.staffRole === selectedRole);
        setFilteredStaff(staffForRole);

        // Check if jobs are already assigned for the selected role
        if (selectedRole) {
            axios.get(`http://localhost:3001/checkJobs/${selectedRole}`)
                .then(response => {
                    setJobsAssigned(response.data.jobsAssigned);
                })
                .catch(error => console.error('Error checking job assignments', error));
        } else {
            setJobsAssigned(false);
        }
    }, [selectedRole, staffList]);

    const assignJobs = () => {
        // Assign job to all filtered staff
        if (filteredStaff.length === 0 || !task) return;

        const jobAssignments = filteredStaff.map(staff => ({
            staffId: staff._id,
            task,
            role: selectedRole
        }));

        // Send job assignments to the server
        axios.post('http://localhost:3001/assign', jobAssignments)
            .then(() => {
                Swal.fire('Success', 'Jobs assigned successfully!', 'success');
                setTask(''); // Reset task input
                setJobsAssigned(true); // Mark jobs as assigned
            })
            .catch(error => console.error('Error assigning jobs', error));
    };

    return (
        <Box m="20px">
            <Typography variant="h4">Manual Job Assignment</Typography>
            <Box mt="20px">
                <Typography variant="h6">Select Role:</Typography>
                <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    fullWidth
                >
                    <MenuItem value="">--Select a Role--</MenuItem>
                    {roles.map(role => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                </Select>
            </Box>

            {filteredStaff.length > 0 && (
                <Box mt="20px">
                    <Typography variant="h6">Available Staff for {selectedRole}:</Typography>
                    <ul>
                        {filteredStaff.map(staff => (
                            <li key={staff._id}>
                                {staff.staffName} (ID: {staff._id})
                            </li>
                        ))}
                    </ul>

                    <TextField
                        variant="outlined"
                        placeholder="Enter task"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={assignJobs}
                        disabled={jobsAssigned} // Disable if jobs are already assigned
                    >
                        {jobsAssigned ? 'Jobs Assigned' : 'Assign Job'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ManualJobAssignment;
