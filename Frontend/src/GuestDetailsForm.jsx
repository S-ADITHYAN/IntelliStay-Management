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
    const totldays = state.totldays || {};// Assuming your data has childrenCount
    
    // Initialize states with counts
    const [adults, setAdults] = useState(Array.from({ length: adultsCount }, () => ({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null
    })));

    const [children, setChildren] = useState(Array.from({ length: childrenCount }, () => ({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null
    })));

    // Handle input change for adults/children
    const handleChange = (e, index, type) => {
        const { name, value } = e.target;
        const updateState = (prevState, setState) => {
            const updatedList = [...prevState];
            updatedList[index] = {
                ...updatedList[index],
                [name]: value
            };
            setState(updatedList);
        };
        
        type === 'adult' ? updateState(adults, setAdults) : updateState(children, setChildren);
    };

    // Add new guest form for adults/children
    const addGuest = (setGuestState) => {
        setGuestState((prevGuests) => [
            ...prevGuests, 
            { name: '', email: '', phone: '', address: '', dob: '', proofType: '', proofNumber: '', proofDocument: null }
        ]);
    };

    // Remove guest form for adults/children
    const removeGuest = (index, setGuestState) => {
        setGuestState((prevGuests) => prevGuests.filter((_, i) => i !== index));
    };

    // Validate form
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
        if (validateForm()) {
            // Only navigate if the form is valid
            onSubmitguests({ adults, children });
        }
    };

    // Navigate to reservation room with guest data
    const onSubmitguests = () => {
        navigate('/reserveroom', { state: { data: datas, roomdata: roomdatas, totlrate: totlrates, adults: adults, children: children, totldays: totldays } });
    };

    // Upload file handler
    const handleFileUpload = (e, index, type) => {
        const file = e.target.files[0];
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
            <div className='guestnav'>
                <Header />
            </div>
            
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
                    <Box sx={{ textAlign: 'center', marginTop: 2 }}>
                        <Button variant="outlined" onClick={() => addGuest(setAdults)}>
                            Add Adult
                        </Button>
                    </Box>

                    {/* Children Section */}
                    {renderGuestFields(children, 'child', setChildren)}
                    <Box sx={{ textAlign: 'center', marginTop: 2 }}>
                        <Button variant="outlined" onClick={() => addGuest(setChildren)}>
                            Add Child
                        </Button>
                    </Box>

                    {/* Submit Button */}
                    <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary"
                        >
                            Submit
                        </Button>
                    </Box>
                </form>
            </Box>
        </>
    );
};

export default GuestDetailsForm;
