import { useState, useEffect } from "react";
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
    allowedGuests: 1,
    allowedChildren: 0,
    amenities: "",
};

const initialValuesMultipleRooms = {
    roomTypeToAdd: "",        // Room type selection
    numberOfRooms: 1,        // Number of rooms to add
    allowedGuests: 1,        // Allowed guests
    allowedChildren: 0,      // Allowed children
    commonamenities: "",      // Amenities details
    commonRate: "",           // Rate for the rooms
    commonStatus: "available", // Default status for the rooms
    commonDescription: "",     // Description for the rooms
    allowedAdults: 1,  
    imagess: [],       // Allowed adults
};


const multipleRoomsSchema = yup.object().shape({
    roomTypeToAdd: yup.string().required("Room type is required"),
    numberOfRooms: yup.number().required("Number of rooms is required").min(1, "At least one room is required"),
    allowedGuests: yup.number().required("Number of allowed guests is required").min(1, "At least one guest is required"),
    allowedChildren: yup.number().required("Number of allowed children is required").min(0, "Cannot have negative children"),
    commonamenities: yup.string().required("Amenities details are required"),
    commonRate: yup.string().required("Rate is required").matches(/^\d+$/, "Rate must be a valid number"), // Ensure it's a valid number
    commonStatus: yup.string().required("Status is required"),
    commonDescription: yup.string().required("Description is required"),
    imagess: yup.mixed().test('fileType', 'Only JPG, JPEG, and PNG files are allowed', (value) => {
        return value.every(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));
    }),
    
    allowedAdults: yup.number().required("Number of allowed adults is required").min(1, "At least one adult is required"),
});


const roomnoRegExp = /^[0-9]+$/;
const rateRegExp = /^[0-9]{1,5}$/;

const checkoutSchema = yup.object().shape({
    roomno: yup.string().matches(roomnoRegExp, "Room number is not valid. Only numbers are allowed").required("required"),
    roomtype: yup.string().required("required"),
    status: yup.string().required("required"),
    rate: yup.string().matches(rateRegExp, "Rate is not valid. Only numbers are allowed.max-4 digits are allowed").required("required"),
    description: yup.string().required("required"),
    images: yup.mixed().test('fileType', 'Only JPG, JPEG, and PNG files are allowed', (value) => {
        return value.every(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));
    }),
     // Add validation for new fields
     allowedGuests: yup.number().required("Number of allowed guests is required").min(1, "At least one guest is required"),
     allowedChildren: yup.number().required("Number of allowed children is required").min(0, "Cannot have negative children"),
     amenities: yup.string().required("Amenities details are required"),
});

const RoomAdd = () => {
    useAuth();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [roomTypes, setRoomTypes] = useState(["Suite Room", "King's Room","Grand Suite King","Twin Bed Room","Honeymoon Nest","Grand Terrace Suite"]);
    const [roomstatus, setRoomstatus] = useState(["available", "Maintenance"]);
    const [newRoomType, setNewRoomType] = useState("");
    const [addingNewRoomType, setAddingNewRoomType] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);

    const [numberOfRooms, setNumberOfRooms] = useState(1);
    const [roomTypeToAdd, setRoomTypeToAdd] = useState("");
    const [commonRate, setCommonRate] = useState("");
    const [commonStatus, setCommonStatus] = useState("");
    const [commonDescription, setCommonDescription] = useState("");

    const [lastRoomNumber, setLastRoomNumber] = useState(0); // State to hold the last room number

     // New state variables for allowed guests, children, and amenities
     const [allowedGuests, setAllowedGuests] = useState(1);
     const [allowedChildren, setAllowedChildren] = useState(0);
     const [commonamenities, setCommonAmenities] = useState("");
     const [allowedAdults, setAllowedAdults] = useState(1);
     // Default value can be adjusted
 

    // Fetch the last room number for the selected room type
    useEffect(() => {
        const fetchLastRoomNumber = async () => {
            if (roomTypeToAdd) {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API}/admin/lastRoomNumber/${roomTypeToAdd}`);
                    setLastRoomNumber(response.data.lastRoomNumber);
                } catch (error) {
                    console.error("Error fetching last room number:", error);
                }
            }
        };

        fetchLastRoomNumber();
    }, [roomTypeToAdd]);

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

        console.log(values);
        axios.post(`${import.meta.env.VITE_API}/admin/addroom`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => {
            if (res.data === "exists") {
                Swal.fire("Error","Room no already exists!","error");
            } else {
                resetForm({ values: initialValues });
                Swal.fire("Success","Room added successfully. :)","success");
            }
        }).catch(err => console.log(err));
    };

    const handleAddRoomType = (e) => {
        if (e.key === "Enter" && newRoomType.trim()) {
            setRoomTypes((prevRoomTypes) => [...prevRoomTypes, newRoomType.trim()]); // Ensure new array reference
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
                    images: row[5]?.split(',').map(img => img.trim()) || [] // Parse images from comma-separated values
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
                await axios.post(`${import.meta.env.VITE_API}/admin/uploadBulkData`, validatedRooms);
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

    const handleMultipleRoomAdd = async (values, { resetForm }) => {
        try {
            const formData = new FormData();

            Object.keys(values).forEach(key => {
                if (key !== 'imagess') {
                    formData.append(key, values[key]);
                }
            });
    
            // Append image files
            for (let i = 0; i < selectedImages.length; i++) {
                formData.append('imagessssss', selectedImages[i]); // Ensure this matches the backend
            }
    
            // Make an API call to add multiple rooms
           
            
            const response = await axios.post(`${import.meta.env.VITE_API}/admin/addMultipleRooms`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            if (response.data.success) {
                resetForm({ values: initialValues });
                Swal.fire("Success", "Rooms added successfully!", "success");
            } else {
                Swal.fire("Error", "Failed to add rooms: " + response.data.message, "error");
            }
        } catch (error) {
            console.error("Error adding multiple rooms:", error);
            Swal.fire("Error", "An error occurred while adding rooms: " + error.message, "error");
        }
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

    const handleAddMultipleRooms = async () => {
        const roomsToAdd = [];
        // const lastRoomNumber = 204; // This should be fetched from the database in a real scenario
        const lastRoomNumberAsInt = parseInt(lastRoomNumber, 10); // Ensure lastRoomNumber is an integer
        for (let i = 0; i < numberOfRooms; i++) {
            roomsToAdd.push({
                roomno: lastRoomNumberAsInt + i + 1, // Increment room number
                roomtype: roomTypeToAdd,
                status: commonStatus,
                rate: commonRate,
                description: commonDescription,
                images: selectedImages,
                allowedGuests:allowedAdults,
                allowedChildren:allowedChildren,
                amenities:commonamenities,
                // Use the same images for all new rooms
            });
        }

        // Call the function to validate and upload rooms
        await handleMultipleRoomAdd(roomsToAdd);
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
                                type="number"
                                label="Number of Allowed Adults"
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('allowedGuests', e.target.value)}
                                value={values.allowedGuests}
                                name="allowedGuests"
                                error={touched.allowedGuests && errors.allowedGuests}
                                helperText={touched.allowedGuests && errors.allowedGuests}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="number"
                                label="Number of Allowed Children"
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('allowedChildren', e.target.value)}
                                value={values.allowedChildren}
                                name="allowedChildren"
                                error={touched.allowedChildren && errors.allowedChildren}
                                helperText={touched.allowedChildren && errors.allowedChildren}
                                sx={{ gridColumn: "span 2" }}
                            />
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Amenities"
                                onBlur={handleBlur}
                                onChange={(e) => setFieldValue('amenities', e.target.value)}
                                value={values.amenities}
                                name="amenities"
                                error={touched.amenities && errors.amenities}
                                helperText={touched.amenities && errors.amenities}
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
            <h2>Add Multiple Rooms</h2>
            <Formik
                initialValues={initialValuesMultipleRooms}
                validationSchema={multipleRoomsSchema}
                onSubmit={handleMultipleRoomAdd}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
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
                            value={values.roomTypeToAdd}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            displayEmpty
                            name="roomTypeToAdd"
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
                                </MenuItem>
                            ))}
                        </Select>

                        <TextField
                            name="numberOfRooms"
                            label="Number of Rooms"
                            type="number"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.numberOfRooms}
                            error={touched.numberOfRooms && Boolean(errors.numberOfRooms)}
                            helperText={touched.numberOfRooms && errors.numberOfRooms}
                            sx={{ gridColumn: "span 2" }}
                        />
                        <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Rate"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.commonRate}
                    name="commonRate"
                    error={touched.commonRate && errors.commonRate}
                    helperText={touched.commonRate && errors.commonRate}
                    sx={{ gridColumn: "span 2" }}
                />

                {/* Add the Status field */}
                <Select
                    fullWidth
                    variant="filled"
                    value={values.commonStatus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    displayEmpty
                    name="commonStatus"
                    sx={{ gridColumn: "span 2" }}
                    renderValue={(selected) => {
                        if (!selected) {
                            return <em>Select Room Status</em>;
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

                {/* Add the Description field */}
                <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Description"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.commonDescription}
                    name="commonDescription"
                    error={touched.commonDescription && errors.commonDescription}
                    helperText={touched.commonDescription && errors.commonDescription}
                    sx={{ gridColumn: "span 4" }}
                />

                        <TextField
                            name="allowedGuests"
                            label="Allowed Guests"
                            type="number"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.allowedGuests}
                            error={touched.allowedGuests && Boolean(errors.allowedGuests)}
                            helperText={touched.allowedGuests && errors.allowedGuests}
                            sx={{ gridColumn: "span 2" }}
                        />

                        <TextField
                            name="allowedChildren"
                            label="Allowed Children"
                            type="number"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.allowedChildren}
                            error={touched.allowedChildren && Boolean(errors.allowedChildren)}
                            helperText={touched.allowedChildren && errors.allowedChildren}
                            sx={{ gridColumn: "span 2" }}
                        />

                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Amenities"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            value={values.commonamenities}
                            name="commonamenities"
                            error={touched.commonamenities && errors.commonamenities}
                            helperText={touched.commonamenities && errors.commonamenities}
                            sx={{ gridColumn: "span 4" }}
                        />

                        <TextField
                            fullWidth
                            variant="filled"
                            type="file"
                            inputProps={{ multiple: true, accept: ".jpg, .jpeg, .png" }}
                            label="Upload Images"
                            onChange={handleImageUpload}
                            name="imagess"
                            error={touched.imagess && errors.imagess}
                            helperText={touched.imagess && errors.imagess}
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

                        <Button
                            type="submit"
                            color="secondary"
                            variant="contained"
                        >
                            Add Multiple Rooms
                        </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default RoomAdd;
