import { useState,useEffect } from "react";
import { Box, Button, TextField, MenuItem, Select, useMediaQuery, IconButton } from "@mui/material";
import { Header } from "../../components";
import { Formik } from "formik";
import * as yup from "yup";
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";
import CloseIcon from '@mui/icons-material/Close';
import {jwtDecode} from "jwt-decode";

const initialValues = {
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
};

const applyLeaveSchema = yup.object().shape({
    
    leaveType: yup.string().required("Leave type is required."),
    startDate: yup.date().required("Start date is required."),
    endDate: yup.date().required("End date is required.")
        .min(yup.ref('startDate'), "End date cannot be before start date."),
    reason: yup.string().required("Reason for leave is required."),
});

const Applyleave = () => {
    useAuth();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [leaveTypes, setLeaveTypes] = useState(["Medical Leave", "Casual Leave"]);
    const [userData, setUserData] = useState(null);

    const handleFormSubmit = (values, { resetForm }) => {
        const formdata={staff_id:userData._id,...values};
        axios.post('http://localhost:3001/applyleave', formdata)
            .then(res => {
                if (res.status === 200) {
                    Swal.fire("Error", res.data.message, "error");
                } else {
                    resetForm({ values: initialValues });
                    Swal.fire("Success", "Leave application submitted successfully!", "success");
                }
            }).catch(err => console.log(err));
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decodedToken = jwtDecode(token);
            setUserData(decodedToken); // Store the decoded data in the state
          } catch (error) {
            console.error("Failed to decode token:", error);
          }
        }
      }, []); 

    return (
        <Box m="20px">
            <Header title="APPLY LEAVE" subtitle="Submit Leave Application" />

            <Formik
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={applyLeaveSchema}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": {
                                    gridColumn: isNonMobile ? undefined : "span 4",
                                },
                            }}
                        >
                            
                            <Select
                                fullWidth
                                variant="filled"
                                value={values.leaveType}
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('leaveType', e.target.value)}
                                displayEmpty
                                name="leaveType"
                                sx={{ gridColumn: "span 2" }}
                            >
                                <MenuItem value="" disabled>Select Leave Type</MenuItem>
                                {leaveTypes.map((type, index) => (
                                    <MenuItem key={index} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                            <TextField
                                fullWidth
                                variant="filled"
                                type="date"
                                label="Start Date"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.startDate}
                                name="startDate"
                                error={touched.startDate && errors.startDate}
                                helperText={touched.startDate && errors.startDate}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="date"
                                label="End Date"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.endDate}
                                name="endDate"
                                error={touched.endDate && errors.endDate}
                                helperText={touched.endDate && errors.endDate}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Reason"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.reason}
                                name="reason"
                                error={touched.reason && errors.reason}
                                helperText={touched.reason && errors.reason}
                                sx={{ gridColumn: "span 4" }}
                            />
                        </Box>
                        <Box mt="20px">
                            <Button type="submit" color="secondary" variant="contained">
                                Submit Leave Application
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default Applyleave;
