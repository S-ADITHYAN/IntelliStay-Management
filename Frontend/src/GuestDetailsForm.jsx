import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    Button, 
    Typography, 
    Grid, 
    Paper, 
    Box, 
    MenuItem,
    Avatar,
    Checkbox,
    FormControlLabel // Add this import
} from '@mui/material';
import logo from '../public/logo1.png';
import facebook from './assets/facebook.png';
import instagram from './assets/instagram.png';
import youtube from './assets/youtube.png';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Header from '../components/Header'; 
import './guestform.css'; // Import the CSS for the form
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Swal from 'sweetalert2'; // Import this at the top of your file

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
        _id:'',
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null,
        errors: {},
        saveDetails: false,
    })));

    const [children, setChildren] = useState(Array.from({ length: childrenCount }, () => ({
        _id:'',
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        proofType: '',
        proofNumber: '',
        proofDocument: null,
        saveDetails: false,
        errors: {},
    })));

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format for date of birth
    const proofNumberRegex = /^[A-Za-z0-9]+$/; // Assuming alphanumeric proof number

    const [selectedGuest, setSelectedGuest] = useState(null);
    const [selectedGuestIds, setSelectedGuestIds] = useState([]);
    const [newGuestDetails, setNewGuestDetails] = useState({ adults: [], children: [] });
    const userid= localStorage.getItem('userId');
    const [previousGuest, setPreviousGuest] = useState([]);
    useEffect(() => {
        // Fetch previous guest details when the component mounts
        const fetchPreviousGuest = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API}/previousGuestDetails/${userid}`);
                console.log(response.data);
                setPreviousGuest(response.data || []); // Ensure it's an array, even if empty
            } catch (error) {
                console.error('Failed to fetch previous guest:', error);
                setPreviousGuest([]); // Set to empty array in case of error
            }
        };

        fetchPreviousGuest();
    }, []);

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
                const datePart = value.split('T')[0];
                return dobRegex.test(datePart) ? '' : 'Invalid date of birth (YYYY-MM-DD)';
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

    const handleSaveDetailsChange = (index, isChecked, type) => {
        if (type === 'adult') {
            setAdults(prevAdults => {
                const updatedAdults = [...prevAdults];
                updatedAdults[index] = { ...updatedAdults[index], saveDetails: isChecked };
                return updatedAdults;
            });
        } else if (type === 'child') {
            setChildren(prevChildren => {
                const updatedChildren = [...prevChildren];
                updatedChildren[index] = { ...updatedChildren[index], saveDetails: isChecked };
                return updatedChildren;
            });
        }
    };

    const handleChange = (e, index, type) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        
        if (type === 'adult') {
            const newAdults = [...adults];
            newAdults[index] = {
                ...newAdults[index],
                [name]: value,
                errors: {
                    ...newAdults[index].errors,
                    [name]: error
                }
            };
            setAdults(newAdults);

            // Update newGuestDetails for adults
            setNewGuestDetails(prev => ({
                ...prev,
                adults: newAdults.map(adult => ({
                    ...adult,
                    errors: undefined // Remove errors from the data to be sent
                }))
            }));
        } else {
            const newChildren = [...children];
            newChildren[index] = {
                ...newChildren[index],
                [name]: value,
                errors: {
                    ...newChildren[index].errors,
                    [name]: error
                }
            };
            setChildren(newChildren);

            // Update newGuestDetails for children
            setNewGuestDetails(prev => ({
                ...prev,
                children: newChildren.map(child => ({
                    ...child,
                    errors: undefined // Remove errors from the data to be sent
                }))
                
            }));
        }
    };

    // Handle form submission
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const guestData = {
                selectedGuestIds,
                newGuestDetails: {
                    adults: adults.filter(adult => !selectedGuestIds.includes(adult._id)),
                    children: children.filter(child => !selectedGuestIds.includes(child._id))
                }
            };
            navigate('/reserveroom', { 
                state: { 
                    ...state, 
                    guestData,
                    adults, 
                    children, 
                    totldays,
                    selectedGuestIds 
                } 
            });
        } else {
            alert('Please fix validation errors before submitting.');
        }
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
    const handlePreviousGuestClick = (guest) => {
        setSelectedGuestIds(prevIds => {
            if (prevIds.includes(guest._id)) {
                return prevIds.filter(id => id !== guest._id);
            } else {
                return [...prevIds, guest._id];
            }
        });

        if (guest.role === 'adult') {
            if (adults.length >= roomdatas.allowedAdults) {
                Swal.fire(`Maximum allowed adults (${allowedAdults}) reached.`);
                return; // Exit the function if the limit is reached
            }
            else{
            setAdults(prevAdults => {
                const existingIndex = prevAdults.findIndex(a => a._id === guest._id);
                if (existingIndex !== -1) {
                    return prevAdults.filter((_, i) => i !== existingIndex);
                } else {
                    return [...prevAdults, { ...guest, errors: {} }];
                }
            });
        }
        } else if (guest.role === 'child') {
            if (adults.length >= roomdatas.allowedChildren) {
                Swal.fire(`Maximum allowed children (${allowedChildren}) reached.`);
                return; // Exit the function if the limit is reached
            }
            else{
            setChildren(prevChildren => {
                const existingIndex = prevChildren.findIndex(c => c._id === guest._id);
                if (existingIndex !== -1) {
                    return prevChildren.filter((_, i) => i !== existingIndex);
                } else {
                    return [...prevChildren, { ...guest, errors: {} }];
                }
            });
        }
        }
    };
    
    const renderPreviousGuest = () => {
        console.log("Rendering previous guests:", previousGuest);
        if (!previousGuest || !Array.isArray(previousGuest) || previousGuest.length === 0) return null;
        return (
            <div>
                <Typography variant="h6" gutterBottom>Saved Guests</Typography>
                {previousGuest.map((guest, index) => (
                    <Box
                        id="previous-guest-item"
                        className="previous-guest-item"
                        key={index}
                        onClick={() => handlePreviousGuestClick(guest)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2,
                            p: 2,
                            border: '1px solid lightgray',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            position: 'relative', // Added for positioning the tick
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'blue', marginRight: '10px' }}>
                            {guest.name[0].toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1">{guest.name}</Typography>
                            <Typography variant="body2">
                                DOB: {new Date(guest.dob).toLocaleDateString("en-GB")}
                            </Typography>
                            <Typography variant="body2">Email: {guest.email}</Typography>
                        </Box>
                        {selectedGuestIds.includes(guest._id) && (
                            <CheckCircleIcon 
                                sx={{ 
                                    position: 'absolute', 
                                    top: 10, 
                                    right: 10, 
                                    color: 'blue' 
                                }} 
                            />
                        )}
                    </Box>
                ))}
            </div>
        );
    };
    // Render form fields for adults and children
    const renderGuestFields = (guests, type, setGuestState) => (
        guests.map((guest, index) => (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }} key={guest._id || index}>
                <Typography variant="h6" gutterBottom>
                    {type === 'adult' ? `Adult ${index + 1}` : `Child ${index + 1}`}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    {/* Render fields based on guest type */}
                    {type === 'child' ? (
                        // Child fields
                        <>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={guest.name}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    error={!!guest.errors.name}
                                    helperText={guest.errors.name}
                                    InputProps={{ readOnly: !!guest._id }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    type="date"
                                    name="dob"
                                    value={guest.dob ? guest.dob.split('T')[0] : ''}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ max: maxDate, min: minDate }}
                                    error={!!guest.errors.dob}
                                    helperText={guest.errors.dob}
                                    InputProps={{ readOnly: !!guest._id }}
                                />
                            </Grid>
                            {!guest._id && (
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={guest.saveDetails || false}
                                    onChange={(e) => handleSaveDetailsChange(index, e.target.checked, type)}
                                    icon={<CheckBoxOutlineBlankIcon />}
                                    checkedIcon={<CheckBoxIcon />}
                                />
                            }
                            label="Save guest details for future bookings"
                        />
                    </Grid>
                )}
                        </>
                    ) : (
                        // Adult fields
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
                                    InputProps={{ readOnly: !!selectedGuest }}
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
                                    InputProps={{ readOnly: !!selectedGuest }}
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
                                    InputProps={{ readOnly: !!selectedGuest }}
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
                                    InputProps={{ readOnly: !!selectedGuest }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                            <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    type="date"
                                    name="dob"
                                    value={guest.dob ? guest.dob.split('T')[0] : ''}
                                    onChange={(e) => handleChange(e, index, type)}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ max: fiveYearsAgo }} // Restrict the maximum selectable date
                                    error={!!guest.errors.dob}
                                    helperText={guest.errors.dob}
                                    InputProps={{ readOnly: !!selectedGuest }}
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
                 {!guest._id && (
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={guest.saveDetails || false}
                                    onChange={(e) => handleSaveDetailsChange(index, e.target.checked, type)}
                                    icon={<CheckBoxOutlineBlankIcon />}
                                    checkedIcon={<CheckBoxIcon />}
                                />
                            }
                            label="Save guest details for future bookings"
                        />
                    </Grid>
                )}
                {/* Only show remove button for newly added guests */}
                {!guest._id && (
                    <Box mt={2}>
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            id='remove-guest-button'
                            onClick={() => removeGuest(index, setGuestState)}
                        >
                            Remove {type === 'adult' ? 'Adult' : 'Child'}
                        </Button>
                    </Box>
                )}
            </Paper>
        ))
    );
    
    // Add this function to handle guest removal
    const removeGuest = (index, setGuestState) => {
        setGuestState(prevGuests => prevGuests.filter((_, i) => i !== index));
    };

    const addGuest = (type) => {
        if (type === 'adult') {
            if (adults.length >= roomdatas.allowedAdults) {
                Swal.fire(`Maximum allowed adults (${allowedAdultsCount}) reached.`);
                return; // Exit the function if the limit is reached
            }
            else{
            setAdults(prevAdults => [
                ...prevAdults,
                {
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    dob: '',
                    proofType: '',
                    proofNumber: '',
                    proofDocument: null,
                    errors: {},
                    // No _id for new guests
                }
            
            ]);
        }
        } else if (type === 'child') {
            if (adults.length >= roomdatas.allowedChildren) {
                Swal.fire(`Maximum allowed children (${allowedChildren}) reached.`);
                return; // Exit the function if the limit is reached
            }
            else{
            setChildren(prevChildren => [
                ...prevChildren,
                {
                    name: '',
                    dob: '',
                    errors: {},
                    // No _id for new guests
                }
            ]);
        }
        }
    };

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
                        {renderPreviousGuest()}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h5">Adults Information</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        {renderGuestFields(adults, 'adult', setAdults)}
                        <Button variant="contained" onClick={() => addGuest('adult')}>
                            Add Adult
                        </Button>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h5">Children Information</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        {renderGuestFields(children, 'child', setChildren)}
                        <Button variant="contained" onClick={() => addGuest('child')}>
                            Add Child
                        </Button>
                    </Grid>

                    <Grid item xs={12} mt={3} style={{ display: 'flex', justifyContent: 'center' }}>
    <Button variant="contained" color="primary" type="submit" id='proceed-to-reserve-room-button'>
        Proceed to Reserve Room
    </Button>
</Grid>
                    </Grid>
                </form>
            </Box>
            {/* <footer className="footer" id="contact">
        <div className="section__container footer__container">
          <div className="footer__col">
            <div className="logo">
              <a href="#home"><img src={logo} alt="logo" /></a>
            </div>
            <p className="section__description">
              Discover a world of comfort, luxury, and adventure as you explore
              our curated selection of hotels, making every moment of your getaway
              truly extraordinary.
            </p>
            <button className="btn">Book Now</button>
          </div>
          <div className="footer__col">
            <h4>QUICK LINKS</h4>
            <ul className="footer__links">
              <li><a href="#">Browse Destinations</a></li>
              <li><a href="#">Special Offers & Packages</a></li>
              <li><a href="#">Room Types & Amenities</a></li>
              <li><a href="#">Customer Reviews & Ratings</a></li>
              <li><a href="#">Travel Tips & Guides</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>OUR SERVICES</h4>
            <ul className="footer__links">
              <li><a href="#">Concierge Assistance</a></li>
              <li><a href="#">Flexible Booking Options</a></li>
              <li><a href="#">Airport Transfers</a></li>
              <li><a href="#">Wellness & Recreation</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>CONTACT US</h4>
            <ul className="footer__links">
              <li><a href="#">intellistay@info.com</a></li>
            </ul>
            <div className="footer__socials">
              <a href="#"><img src={facebook} alt="facebook" /></a>
              <a href="#"><img src={instagram} alt="instagram" /></a>
              <a href="#"><img src={youtube} alt="youtube" /></a>
            </div>
          </div>
        </div>
        <div className="footer__bar">
          Copyright © 2024 INTELLISTAY Pvt.LTD. All rights reserved.
        </div>
      </footer> */}
        </>
    );
};

export default GuestDetailsForm;
