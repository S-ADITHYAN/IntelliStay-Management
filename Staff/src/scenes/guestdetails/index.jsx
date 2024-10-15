import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    Typography, 
    Grid, 
    Paper, 
    Box, 
    MenuItem 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from "../../useAuth";
 // Import the CSS for the form

const documentOptions = [
    { label: 'Aadhar', value: 'aadhar' },
    { label: 'Driving License', value: 'drivingLicense' },
    { label: 'Passport', value: 'passport' },
];

const GuestDetails = () => {
    useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    
    const adultsCount = state.adult || 0;
    const childrenCount = state.children || 0;
    const roomdatas = state.roomdata || {};
    const totlrates = state.totlrate || {};
    const totldays = state.totldays || {};
    const checkInDate=state.checkInDate || '';
    const checkOutDate=state.checkOutDate || '';
    console.log(roomdatas)
     console.log(adultsCount)
    // Initialize guest states based on adults and children counts
    const [adults, setAdults] = useState(Array.from({ length: adultsCount }, () => ({
        name: '', email: '', phone: '', address: '', dob: '', proofType: '', proofNumber: '', proofDocument: null
    })));
    const [children, setChildren] = useState(Array.from({ length: childrenCount }, () => ({
        name: '', email: '', phone: '', address: '', dob: '', proofType: '', proofNumber: '', proofDocument: null
    })));

    // Handle input change for adults/children
    const handleChange = (e, index, type) => {
        const { name, value } = e.target;
        const updateState = (prevState, setState) => {
            const updatedList = [...prevState];
            updatedList[index] = { ...updatedList[index], [name]: value };
            setState(updatedList);
        };
        type === 'adult' ? updateState(adults, setAdults) : updateState(children, setChildren);
    };

    // Add new guest form
    const addGuest = (setGuestState) => {
        setGuestState((prevGuests) => [
            ...prevGuests, 
            { name: '', email: '', phone: '', address: '', dob: '', proofType: '', proofNumber: '', proofDocument: null }
        ]);
    };

    // Remove guest form
    const removeGuest = (index, setGuestState) => {
        setGuestState((prevGuests) => prevGuests.filter((_, i) => i !== index));
    };

    // Validate form fields for each guest
    const validateForm = () => {
        const isValid = (guests) => guests.every(guest => 
            guest.name.trim() && 
            guest.email.trim() && 
            guest.phone.trim() &&
            guest.address.trim() &&
            guest.dob.trim() &&
            guest.proofType &&
            guest.proofNumber.trim()
        );
        return isValid(adults) && isValid(children);
    };

    // Handle form submission
    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log("roomdats:",roomdatas)

        if (validateForm()) {
            navigate('/dashboard/confirmreservation', { 
                state: { 
                    
                    roomdata: roomdatas, 
                    totlrate: totlrates, 
                    adults, 
                    children, 
                    totldays ,
                    checkInDate,
                    checkOutDate
                }
            });
        } else {
            alert('Please fill all required fields for each guest.');
        }
    };

    // Handle file upload
    const handleFileUpload = (e, index, type) => {
        const file = e.target.files[0];
        const updatedGuests = type === 'adult' ? [...adults] : [...children];
        updatedGuests[index].proofDocument = file;
        type === 'adult' ? setAdults(updatedGuests) : setChildren(updatedGuests);
    };

    // Render form fields for adults and children
    const renderGuestFields = (guests, type, setGuestState) => (
        guests.map((guest, index) => (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }} key={index}>
                <Typography variant="h6" gutterBottom>
                    {type === 'adult' ? `Adult ${index + 1}` : `Child ${index + 1}`}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Name"
                            variant="outlined"
                            name="name"
                            value={guest.name}
                            onChange={(e) => handleChange(e, index, type)}
                            required
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
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Button
                                    variant="outlined"
                                    color="success"
                                    component="label"
                                    fullWidth
                                >
                                    Upload {guest.proofType} Document
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*,application/pdf"
                                        onChange={(e) => handleFileUpload(e, index, type)}
                                    />
                                </Button>
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12} md={3}>
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={() => removeGuest(index, setGuestState)}
                        >
                            Remove
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        ))
    );

    return (
        <>
            
            
            <Box sx={{ marginLeft: { xs: '10px', md: '20px' }, marginTop: { xs: '20px', md: '40px' } }}>
                <Typography 
                    className="guest-header" 
                    variant="h5" 
                    gutterBottom
                    sx={{ textAlign: { xs: 'center', md: 'left' } }} 
                >
                   Fill Guest Details
                </Typography>

                <form onSubmit={handleFormSubmit}>
                    {/* Adults Section */}
                     {renderGuestFields(adults, 'adult', setAdults)}
                    {/*<Box sx={{ textAlign: 'center', marginTop: 2 }}>
                        <Button variant="outlined" onClick={() => addGuest(setAdults)}>
                            Add Adult
                        </Button>
                    </Box>

                    {/* Children Section */}
                     {renderGuestFields(children, 'child', setChildren)}
                   {/* <Box sx={{ textAlign: 'center', marginTop: 2 }}>
                        <Button variant="outlined" onClick={() => addGuest(setChildren)}>
                            Add Child
                        </Button>
                    </Box> */} 

                    {/* Submit Button */}
                    <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="success"
                        >
                            Submit
                        </Button>
                    </Box>
                </form>
            </Box>
        </>
    );
};

export default GuestDetails;
