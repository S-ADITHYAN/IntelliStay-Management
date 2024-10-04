import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  useTheme,
  IconButton
} from "@mui/material";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'; // Plus icon for photo upload
import { jwtDecode } from "jwt-decode";
import axios from "axios"; // Import axios for API requests
import Swal from 'sweetalert2';
import Header from "../Header";
import './MyProfile.css'
import useAuth from "../../src/useAuth";

const MyProfile = () => {
  useAuth();
  const [editMode, setEditMode] = useState(false); // Track if in edit mode
  const [changePasswordMode, setChangePasswordMode] = useState(false); // Track if in change password mode
  const [selectedImage, setSelectedImage] = useState(null); // For storing selected image
  const theme = useTheme(); // Access current theme
  const [userData, setUserData] = useState(null); // Store decoded token data
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    address: "",
    image: "",
    role: "",
    phone_no: "",
    dob: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch profile data from the server using user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken); // Store the decoded data in the state

        // Fetch the profile data based on user ID or email
        axios.get(`http://localhost:3001/profile/${decodedToken._id}`)
          .then(response => {
            const data = response.data;
            setProfileData({
              displayName: data.displayName,
              email: data.email,
              phone_no: data.phone_no,
              role: data.role,
              address: data.address,
              dob: data.dob,
              image: data.image || "/path-to-default-pic.jpg"
            });
          })
          .catch(error => {
            console.error("Error fetching profile data:", error);
          });

      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, [profileData]);

  const handleUpdateClick = () => {
    setEditMode(true); // Enable edit mode
  };

  const handleInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Update profile data on the server
    axios.put(`http://localhost:3001/profile/update/${userData._id}`, profileData)
      .then(response => {
        Swal.fire("Success", "Profile updated successfully:", "success");
        setEditMode(false); // Disable edit mode after saving
      })
      .catch(error => {
        Swal.fire("Error", "Error updating profile data:", "error");
      });
  };

  const handlePasswordChange = () => {
    setChangePasswordMode(true); // Enable password change mode
  };

  const handlePasswordInputChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire("Error", "New password and confirm password do not match!", "error");
      return;
    }

    // Send current password and new password to the backend
    axios.put(`http://localhost:3001/change-password/${userData._id}`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
    .then(response => {
      Swal.fire("Success", "Password changed successfully", "success");
      setChangePasswordMode(false); // Disable password change mode
    })
    .catch(error => {
      Swal.fire("Error", "Current password is incorrect or error updating password", "error");
    });
  };

  // Handle file input change
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file); // Store the selected image
  
    // Upload image to the server
    const formData = new FormData();
    formData.append("image", file);
  
    axios.post(`http://localhost:3001/upload-photo/${userData._id}`, formData) // Change to `/upload-photo/`
      .then(response => {
        Swal.fire("Success", "Profile image updated successfully", "success");
        setProfileData({ ...profileData, image: URL.createObjectURL(file) }); // Update image preview

      })
      .catch(error => {
        Swal.fire("Error", "Error uploading image", "error");
      });
  };
  
  return (
    <>
    <div className='myprofile_nav'> <Header /> </div>
    <Paper
      elevation={3}
      sx={{
        padding: 3,
        margin: "auto",
        maxWidth: 600,
        mt: 5,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? "#333" : "#f9f9f9",
        color: theme.palette.mode === 'dark' ? "#fff" : "#000",
      }}
    >
      {/* Profile Picture and User Info */}
      <Box display="flex" flexDirection="column" alignItems="center" mb={4} position="relative">
  <Avatar
    alt={profileData.displayName}
    src={`http://localhost:3001/profilepicture/${profileData.image}`}
    sx={{
      width: 150,
      height: 150,
      mb: 1,
      border: `4px solid ${theme.palette.primary.main}`,
    }}
  />
  <IconButton
    component="label"
    sx={{
      position: "absolute",
      bottom: 28,  // Adjusted closer to the Avatar
      right: "37%", // Adjusted to be closer to the right edge of the Avatar
      backgroundColor: theme.palette.primary.main,
      color: "#fff",
      '&:hover': { backgroundColor: theme.palette.primary.dark },
    }}
  >
    <input hidden accept=".jpg,.jpeg,.png" type="file" onChange={handleImageUpload} />
    <AddAPhotoIcon />
  </IconButton>
  <Typography variant="h5" fontWeight="bold" mt={2}> {/* Added margin-top to move the text slightly lower */}
    {profileData.displayName}
  </Typography>
</Box>

      {/* Profile Details */}
      <Grid container spacing={2}>
        {/* Name Field */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Name:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.displayName}</Typography>
          )}
        </Grid>

        {/* Email Field */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Email:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.email}</Typography>
          )}
        </Grid>

        {/* Phone Number */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Phone Number:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="phone_no"
              value={profileData.phone_no}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.phone_no}</Typography>
          )}
        </Grid>

        {/* Role */}
        {/* <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Role:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="role"
              value={profileData.role}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.role}</Typography>
          )}
        </Grid> */}

        {/* Date of Birth */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Dob:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="dob"
              value={profileData.dob}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.dob}</Typography>
          )}
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Address:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.address}</Typography>
          )}
        </Grid>

        {/* Salary */}
        {/* <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Salary:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="salary"
              value={profileData.salary}
              onChange={handleInputChange}
              sx={{ color: theme.palette.text.primary }}
            />
          ) : (
            <Typography variant="h6">{profileData.salary}</Typography>
          )}
        </Grid> */}

        {/* Buttons */}
        <Grid item xs={12} textAlign="center">
          {editMode ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ mt: 2, mr: 2 }}
            >
              Save
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateClick}
              sx={{ mt: 2, mr: 2 }}
            >
              Edit Profile
            </Button>
          )}

          {/* Change Password */}
          {!changePasswordMode ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handlePasswordChange}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          ) : (
            <Box>
              <Typography variant="body1" color="textSecondary" mt={2}>
                Current Password:
              </Typography>
              <TextField
                fullWidth
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                sx={{ color: theme.palette.text.primary }}
              />
              <Typography variant="body1" color="textSecondary" mt={2}>
                New Password:
              </Typography>
              <TextField
                fullWidth
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                sx={{ color: theme.palette.text.primary }}
              />
              <Typography variant="body1" color="textSecondary" mt={2}>
                Confirm New Password:
              </Typography>
              <TextField
                fullWidth
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                sx={{ color: theme.palette.text.primary }}
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handlePasswordSave}
                sx={{ mt: 2 }}
              >
                Save Password
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
    </>
  );
};

export default MyProfile;
