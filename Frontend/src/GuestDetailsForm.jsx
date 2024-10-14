import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    Button, 
    Typography, 
    Grid, 
    Paper, 
    Box, 
    MenuItem 
} from '@mui/material';
import Header from '../components/Header'; 
import './guestform.css'; // Import the CSS for the form
import { useLocation, useNavigate } from 'react-router-dom';

const documentOptions = [
    { label: 'Aadhar', value: 'aadhar' },
    { label: 'Driving License', value: 'drivingLicense' },
    { label: 'Passport', value: 'passport' },
];

const GuestDetailsForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    const datas = state.data || {};
    const adultsCount = datas.adults || 0; // Assuming your data has adultsCount
    const childrenCount = datas.children|| 0; 
    const roomdatas = state.roomdata || {};
    const totlrates = state.totlrate || {};
    const totldays = state.totldays || {}; // Assuming your data has childrenCount
    const [preview, setPreview] = useState(null);
    const today = new Date();
    const fiveYearsAgo = new Date(today.setFullYear(today.getFullYear() - 18)).toISOString().split('T')[0];
    const todays = new Date();
    const yesterday = new Date(todays);
    yesterday.setDate(todays.getDate() - 1);
     // Set to yesterday
    const Years = new Date(yesterday);
    Years.setFullYear(yesterday.getFullYear() - 5); // Calculate five years ago from yesterday

// Format for input type="date"
const maxDate = yesterday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
const minDate = Years.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Initialize states with counts
    const [adults, setAdults] = useState(Array.from({ length: adultsCount }, () => ({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null,
        errors: {},
    })));

    const [children, setChildren] = useState(Array.from({ length: childrenCount }, () => ({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null,
        errors: {},
    })));

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format for date of birth
    const proofNumberRegex = /^[A-Za-z0-9]+$/; // Assuming alphanumeric proof number

    // Handle input change for adults/children with validation
    const handleChange = (e, index, type) => {
        const { name, value } = e.target;
        const updateState = (prevState, setState) => {
            const updatedList = [...prevState];
            const errors = validateField(name, value);
            updatedList[index] = {
                ...updatedList[index],
                [name]: value,
                errors: { ...updatedList[index].errors, [name]: errors },
            };
            setState(updatedList);
        };

        type === 'adult' ? updateState(adults, setAdults) : updateState(children, setChildren);
    };

    // Add new guest form for adults/children
    const addGuest = (setGuestState) => {
        setGuestState((prevGuests) => [
            ...prevGuests, 
            { name: '', email: '', phone: '', address: '', dob: '', proofType: '', proofNumber: '', proofDocument: null, errors: {} }
        ]);
    };

    // Remove guest form for adults/children
    const removeGuest = (index, setGuestState) => {
        setGuestState((prevGuests) => prevGuests.filter((_, i) => i !== index));
    };

    // Validate individual form field
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                return nameRegex.test(value) ? '' : 'Invalid name format (letters only)';
            case 'email':
                return emailRegex.test(value) ? '' : 'Invalid email format';
                case 'phone':
                    const validatePhone = (phone) => {
                        const regex = /^[0-9]{10}$/; // Check if the phone number is exactly 10 digits
                        const isRepeating = /^(\d)\1{9}$/.test(phone); // Check if all digits are the same
                
                        if (!regex.test(phone)) {
                            return "Phone number must be exactly 10 digits.";
                        }
                
                        if (isRepeating) {
                            return "Phone number cannot consist of repeating digits.";
                        }
                
                        return ""; // Return empty string if validation passes
                    };
                
                    return validatePhone(value); // Call validatePhone with the value entered by the user
                
            case 'dob':
                return dobRegex.test(value) ? '' : 'Invalid date of birth (YYYY-MM-DD)';
            case 'proofNumber':
                return proofNumberRegex.test(value) ? '' : 'Invalid proof number format';
            default:
                return '';
        }
    };

    // Validate form
    const validateForm = () => {
        const isValid = (guests) => guests.every(guest => {
            const errors = {};
            errors.name = validateField('name', guest.name);
            errors.email = validateField('email', guest.email);
            errors.phone = validateField('phone', guest.phone);
            errors.dob = validateField('dob', guest.dob);
            if (guest.proofType) {
                errors.proofNumber = validateField('proofNumber', guest.proofNumber);
            }

            return Object.values(errors).every(error => error === '');
        });

        return isValid(adults) && isValid(children);
    };

    // Handle form submission
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmitguests();
        } else {
            alert('Please fix validation errors before submitting.');
        }
    };

    // Navigate to reservation room with guest data
    const onSubmitguests = () => {
        navigate('/reserveroom', { state: { data: datas, roomdata: roomdatas, totlrate: totlrates, adults, children, totldays } });
    };

    // Upload file handler
    const handleFileUpload = (e, index, type) => {
        const file = e.target.files[0];
        if (file) {
            // Create a preview URL for the selected file
            const filePreviewUrl = URL.createObjectURL(file);
            setPreview(filePreviewUrl);
            // You can also handle the file upload logic here
        }
        if (type === 'adult') {
            const newAdults = [...adults];
            newAdults[index].proofDocument = file;
            setAdults(newAdults);
        } else {
            const newChildren = [...children];
            newChildren[index].proofDocument = file;
            setChildren(newChildren);
        }
    };

    


    // Render form fields for adults and children
    const renderGuestFields = (guests, type, setGuestState) => (
        guests.map((guest, index) => (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }} key={index}>
                <Typography variant="h6" gutterBottom>
                    {type === 'adult' ? `Adult ${index + 1}` : `Child ${index + 1}`}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    {type === 'child' ? (
                        // Only render Name and Date of Birth for children
                        <>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    variant="outlined"
                                    name="name"
                                    value={guest.name}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    error={!!guest.errors.name}
                                    helperText={guest.errors.name}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    variant="outlined"
                                    name="dob"
                                    value={guest.dob}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: minDate, // Set minimum date to five years ago
                                        max: maxDate, // Set maximum date to yesterday
                                    }}
                                    error={!!guest.errors.dob}
                                    helperText={guest.errors.dob}
                                />
                            </Grid>
                        </>
                    ) : (
                        // Render all fields for adults
                        <>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    variant="outlined"
                                    name="name"
                                    value={guest.name}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    error={!!guest.errors.name}
                                    helperText={guest.errors.name}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    variant="outlined"
                                    name="email"
                                    value={guest.email}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    type="email"
                                    error={!!guest.errors.email}
                                    helperText={guest.errors.email}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    variant="outlined"
                                    name="phone"
                                    value={guest.phone}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    type="tel"
                                    error={!!guest.errors.phone}
                                    helperText={guest.errors.phone}
                                />
                            </Grid>
                            <Grid item xs={12} md={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    variant="outlined"
                                    name="address"
                                    value={guest.address}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    variant="outlined"
                                    name="dob"
                                    value={guest.dob}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        max: fiveYearsAgo, // Restrict the maximum selectable date
                                    }}
                                    error={!!guest.errors.dob}
                                    helperText={guest.errors.dob}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Proof of Identity"
                                    variant="outlined"
                                    name="proofType"
                                    value={guest.proofType}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                >
                                    {documentOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {guest.proofType && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={`${guest.proofType.charAt(0).toUpperCase() + guest.proofType.slice(1)} Number`}
                                            variant="outlined"
                                            name="proofNumber"
                                            value={guest.proofNumber}
                                            onChange={(e) => handleChange(e, index, type)}
                                            required
                                            error={!!guest.errors.proofNumber}
                                            helperText={guest.errors.proofNumber}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        {preview && (
                                            <div style={{ marginTop: '10px', marginBottom: '5px' }}>
                                                <h4>Preview:</h4>
                                                <img
                                                    src={preview}
                                                    alt="File Preview"
                                                    style={{ maxWidth: '15%', height: 'auto' }} // Ensure the image fits well
                                                />
                                            </div>
                                        )}
                                        <Button
                                            variant="contained"
                                            component="label"
                                            fullWidth
                                        >
                                            Upload {guest.proofType} Document
                                            <input
                                                type="file"
                                                hidden
                                                onChange={(e) => handleFileUpload(e, index, type)}
                                            />
                                        </Button>
                                    </Grid>
                                </>
                            )}
                        </>
                    )}
                </Grid>
            </Paper>
        ))
    );
    
    //             <Box mt={2}>
    //                 {/* <Button variant="contained" color="secondary" onClick={() => removeGuest(index, setGuestState)}>
    //                     Remove {type === 'adult' ? 'Adult' : 'Child'}
    //                 </Button> */}
    //             </Box>
    //         </Paper>
    //     ))
    // );

    return (
        <>
        <div className='guestnav'>
            <Header title="Guest Information" subtitle="Fill in guest details" />
            </div>
            <Box className="guest-form-container">
                <form onSubmit={handleFormSubmit}>
                    <Grid container spacing={2}>
                    <Grid item xs={12} style={{ textAlign: 'center' }}>
                        <Typography
                            variant="h5"
                            sx={{ 
                                textDecoration: 'underline', 
                                textDecorationColor: 'skyblue' 
                            }}
                        >
                            Fill Guest Details
                        </Typography>
                    </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h5">Adults Information</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            {renderGuestFields(adults, 'adult', setAdults)}
                            {/* <Button variant="contained" onClick={() => addGuest(setAdults)}>
                                Add Adult
                            </Button> */}
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h5">Children Information</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            {renderGuestFields(children, 'child', setChildren)}
                            {/* <Button variant="contained" onClick={() => addGuest(setChildren)}>
                                Add Child
                            </Button> */}
                        </Grid>

                        <Grid item xs={12} mt={3} style={{ display: 'flex', justifyContent: 'center' }}>
    <Button variant="contained" color="primary" type="submit">
        Proceed to Reserve Room
    </Button>
</Grid>
                    </Grid>
                </form>
            </Box>
        </>
    );
};

export default GuestDetailsForm;
