import { useState } from "react";
import { Box, Button, TextField, MenuItem, Select, useMediaQuery, IconButton } from "@mui/material";
import { Header } from "../../components";
import { Formik } from "formik";
import * as yup from "yup";
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";
import CloseIcon from '@mui/icons-material/Close';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const initialValues = {
    roomno: "",
    roomtype: "",
    status: "",
    rate: "",
    description: "",
    images: [],
};

const roomnoRegExp = /^[0-9]+$/;
const rateRegExp = /^[0-9]+$/;

const checkoutSchema = yup.object().shape({
    roomno: yup.string().matches(roomnoRegExp, "Room number is not valid. Only numbers are allowed").required("required"),
    roomtype: yup.string().required("required"),
    status: yup.string().required("required"),
    rate: yup.string().matches(rateRegExp, "Rate is not valid. Only numbers are allowed").required("required"),
    description: yup.string().required("required"),
    images: yup.mixed().test('fileType', 'Only JPG, JPEG, and PNG files are allowed', (value) => {
        return value.every(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));
    })
});

const RoomAdd = () => {
    useAuth();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [roomTypes, setRoomTypes] = useState(["Sweet Room", "King's Room"]);
    const [roomstatus, setRoomstatus] = useState(["available", "Maintenance"]);
    const [newRoomType, setNewRoomType] = useState("");
    const [addingNewRoomType, setAddingNewRoomType] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);

    const handleFormSubmit = (values, { resetForm }) => {
        const formData = new FormData();

        // Append all form fields
        Object.keys(values).forEach(key => {
            if (key !== 'images') {
                formData.append(key, values[key]);
            }
        });

        // Append image files
        for (let i = 0; i < selectedImages.length; i++) {
            formData.append('images', selectedImages[i]);
        }

        axios.post('http://localhost:3001/addroom', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => {
            if (res.data === "exists") {
                Swal.fire("Error","Room already exists!","error");
            } else {
                resetForm({ values: initialValues });
                Swal.fire("Success","Room added successfully. :)","success");
            }
        }).catch(err => console.log(err));
    };

    const handleAddRoomType = (e) => {
        if (e.key === "Enter" && newRoomType.trim()) {
            setRoomTypes([...roomTypes, newRoomType.trim()]);
            setNewRoomType("");
            setAddingNewRoomType(false);
        }
    };

    const handleDeleteRoomType = (typeToDelete) => {
        setRoomTypes(roomTypes.filter(type => type !== typeToDelete));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.name.split('.').pop();
            const reader = new FileReader();

            reader.onload = async (event) => {
                const data = event.target.result;
                let parsedData;

                if (fileType === 'csv') {
                    parsedData = Papa.parse(data, { header: true }).data;
                } else if (fileType === 'xlsx') {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    parsedData = parsedData.slice(1); // Skip header row
                }

                // Validate parsed data
                const formattedData = parsedData.map(row => ({
                    roomno: row[0],
                    roomtype: row[1],
                    status: row[2],
                    rate: row[3],
                    description: row[4],
                }));

                // Validate and upload rooms
                await validateAndUploadRooms(formattedData);
            };

            reader.readAsBinaryString(file);
        }
    };

    // Validation function
   
    // const validateBulkData = (data) => {
    //     const errors = [];
    //     data.forEach((row, index) => {
    //         if ( roomSchema.validate(row)) {
    //             errors.push({ row: index + 2, error: "Invalid room number" });
    //         }
    //         // Add more validation rules as needed
    //     });
    //     return errors;
    // };
    const validateAndUploadRooms = async (rooms) => {
        const validatedRooms = [];
        const errors = [];

        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];

            try {
                // Validate the room data using yup schema
                await checkoutSchema.validate(room, { abortEarly: false });
                validatedRooms.push(room);
            } catch (validationError) {
                // Collect validation errors for the current row
                if (validationError.inner) {
                    validationError.inner.forEach(err => {
                        errors.push(`Row ${i + 1}: ${err.message}`);
                    });
                } else {
                    errors.push(`Row ${i + 1}: ${validationError.message}`);
                }
            }
        }

        if (errors.length > 0) {
            // Show validation errors to the user
            Swal.fire({
                title: "Validation Errors",
                html: errors.join("<br>"),
                icon: "error",
            });
            // Download errors in CSV and XLSX formats
            downloadCSV(errors.map((error, index) => ({ row: index + 1, error })));
            downloadXLSX(errors.map((error, index) => ({ row: index + 1, error })));
        } else {
            // No validation errors, proceed to bulk upload
            try {
                await axios.post('http://localhost:3001/uploadBulkData', validatedRooms);
                Swal.fire("Success", "Bulk data uploaded successfully!", "success");
            } catch (error) {
                Swal.fire("Error", "Failed to upload bulk data. Please try again.", "error");
            }
        }
    };


    // Download functions
    const downloadCSV = (data) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "validation_errors.csv");
    };

    const downloadXLSX = (data) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
        const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([xlsxData], { type: "application/octet-stream" });
        saveAs(blob, "validation_errors.xlsx");
    };

    const downloadCSVTemplate = () => {
        const data = [
            {
                roomno: "Example: 101",
                roomtype: "Example: Single",
                status: "Example: available",
                rate: "Example: 100",
                description: "Example: Cozy room",
            },
        ];
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "room_template.csv");
    };

    const downloadXLSXTemplate = () => {
        const data = [
            { roomno: "Example: 101", roomtype: "Example: Single", status: "Example: available", rate: "Example: 100", description: "Example: Cozy room" },
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
        const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([xlsxData], { type: "application/octet-stream" });
        saveAs(blob, "room_template.xlsx");
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));

        if (validFiles.length === 0) {
            Swal.fire("Error", "Only JPG, JPEG, and PNG files are allowed.", "error");
        } else {
            setSelectedImages(validFiles);
        }
    };
    return (
        <Box m="20px">
            <Header title="ADD ROOM" subtitle="Add New Room Details" />

            <Formik
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={checkoutSchema}
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Room no"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.roomno}
                                name="roomno"
                                error={touched.roomno && errors.roomno}
                                helperText={touched.roomno && errors.roomno}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <Select
                                fullWidth
                                variant="filled"
                                value={values.roomtype}
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('roomtype', e.target.value)}
                                displayEmpty
                                name="roomtype"
                                sx={{ gridColumn: "span 2" }}
                                renderValue={(selected) => {
                                    if (!selected) {
                                        return <em>Select Room Type</em>;
                                    }
                                    return selected;
                                }}
                            >
                                {roomTypes.map((type, index) => (
                                    <MenuItem key={index} value={type}>
                                        {type}
                                        <IconButton
                                            onClick={() => handleDeleteRoomType(type)}
                                            sx={{ ml: 2 }}
                                            size="small"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </MenuItem>
                                ))}
                                {addingNewRoomType ? (
                                    <TextField
                                        value={newRoomType}
                                        onChange={(e) => setNewRoomType(e.target.value)}
                                        onKeyDown={handleAddRoomType}
                                        placeholder="Type and press enter..."
                                        variant="standard"
                                        fullWidth
                                        sx={{ margin: "8px 16px" }}
                                    />
                                ) : (
                                    <MenuItem
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevents the menu from closing
                                            setAddingNewRoomType(true);
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            sx={{ backgroundColor: "#5995fd" }}
                                        >
                                            Add New Room Type
                                        </Button>
                                    </MenuItem>
                                )}
                            </Select>
                            <Select
                                fullWidth
                                variant="filled"
                                value={values.status}
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('status', e.target.value)}
                                displayEmpty
                                name="status"
                                sx={{ gridColumn: "span 2" }}
                                renderValue={(selected) => {
                                    if (!selected) {
                                        return <em>Select Status</em>;
                                    }
                                    return selected;
                                }}
                            >
                                {roomstatus.map((status, index) => (
                                    <MenuItem key={index} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Rate"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.rate}
                                name="rate"
                                error={touched.rate && errors.rate}
                                helperText={touched.rate && errors.rate}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Description"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.description}
                                name="description"
                                error={touched.description && errors.description}
                                helperText={touched.description && errors.description}
                                sx={{ gridColumn: "span 4" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="file"
                                inputProps={{ multiple: true, accept: ".jpg, .jpeg, .png" }}
                                label="Upload Images"
                                onChange={handleImageUpload}
                                name="images"
                                error={touched.images && errors.images}
                                helperText={touched.images && errors.images}
                                sx={{ 
                                    gridColumn: "span 4", 
                                    '& .MuiInputLabel-root': { 
                                      marginBottom: '10px' // Adjust this value for the desired gap
                                    },
                                    '& .MuiFilledInput-root': {
                                      paddingTop: '30px', // Increase the padding to make space for the label
                                    }
                                  }}
                                  InputLabelProps={{
                                    shrink: true, // This keeps the label in the "shrunk" position
                                  }}
                            />
                        </Box>
                        <Box  mt="20px">
                            <Button type="submit" color="secondary" variant="contained" >
                                Add Room
                            </Button><br></br><br></br>
                            <input
                                accept=".csv, .xlsx"
                                id="bulk-upload"
                                type="file"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="bulk-upload">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    component="span"
                                    
                                >
                                    Upload Bulk Data
                                </Button>
                            </label><br></br><br></br>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={downloadCSVTemplate}
                                
                            >
                                Download CSV Template
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={downloadXLSXTemplate}
                                sx={{ ml: 2 }}
                            >
                                Download XLSX Template
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default RoomAdd;
