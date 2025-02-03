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
  IconButton,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'; // Plus icon for photo upload
import { jwtDecode } from "jwt-decode";
import axios from "axios"; // Import axios for API requests
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";

// Regular expressions for validation
const phoneRegex = /^[0-9]{10}$/; // Adjust the regex as per your phone number format requirements
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[a-zA-Z\d[^a-zA-Z\d]]{6,50}$/; // Password pattern: min 6 chars, at least one letter, one number, and one special character
const displayNameRegx=/^[A-Za-z]+$/;

const MyProfile = () => {
  useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState(false); // State for password visibility
  const [selectedImage, setSelectedImage] = useState(null);
  const theme = useTheme();
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    address: "",
    salary: "",
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

  const [errors, setErrors] = useState({}); // To store validation errors

  // Fetch user profile data based on user ID
  const fetchProfileData = async (userId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/staff/profile/${userId}`);
      const data = response.data;
      console.log(data);
      setProfileData({
        displayName: data.displayName,
        email: data.email,
        phone_no: data.phone_no,
        role: data.role,
        address: data.address,
        dob: data.dob,
        salary: data.salary,
        image: data.image || "/path-to-default-pic.jpg"
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  // Fetch profile data from the server using user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken);
        fetchProfileData(decodedToken._id);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  const handleUpdateClick = () => {
    setEditMode(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });

    // Validate inputs
    if (name === "displayName" && !displayNameRegx.test(value)) {
      setErrors((prev) => ({ ...prev, displayName: "Invalid name. Only characters are allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, displayName: undefined }));
    }

    if (name === "phone_no" && !phoneRegex.test(value)) {
      setErrors((prev) => ({ ...prev, phone_no: "Invalid phone number. Must be 10 digits." }));
    } else {
      setErrors((prev) => ({ ...prev, phone_no: undefined }));
    }

    if (name === "email" && !emailRegex.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSave = async () => {
    if (errors.phone_no || errors.email) {
      Swal.fire("Error", "Please fix the validation errors before saving!", "error");
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_API}/staff/profile/${userData._id}`, profileData);
      Swal.fire("Success", "Profile updated successfully", "success");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile data:", error);
      Swal.fire("Error", "Error updating profile data", "error");
    }
  };

  const handlePasswordChange = () => {
    setChangePasswordMode(true);
  };

  const handlePasswordInputChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    // Validate new password against regex
    if (e.target.name === "newPassword" && !passwordRegex.test(e.target.value)) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Password must be at least 6 characters, include one letter, one number, and one special character."
      }));
    } else {
      setErrors((prev) => ({ ...prev, newPassword: undefined }));
    }

    // Check if passwords match
    if (e.target.name === "confirmPassword" && e.target.value !== passwordData.newPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire("Error", "New password and confirm password do not match!", "error");
      return;
    }

    if (errors.newPassword || errors.confirmPassword) {
      Swal.fire("Error", "Please fix the validation errors before saving!", "error");
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_API}/staff/change-password/${userData._id}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      Swal.fire("Success", "Password changed successfully", "success");
      setChangePasswordMode(false);
    } catch (error) {
      console.error("Error changing password:", error);
      Swal.fire("Error", "Current password is incorrect or error updating password", "error");
    }
  };

  // Handle file input change
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      Swal.fire("Error", "File size exceeds 2MB limit.", "error");
      return;
    }
    // Upload image to the server
    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.post(`${import.meta.env.VITE_API}/staff/upload-photo/${userData._id}`, formData);
      Swal.fire("Success", "Profile image updated successfully", "success");
      setProfileData((prevData) => ({ ...prevData, image: URL.createObjectURL(file) }));
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        Swal.fire("Error", error.response.data.message, "error");
      } else {
        console.error("Error uploading image:", error);
        Swal.fire("Error", `Error uploading image: ${error.message}`, "error");
      }
    }
  };

  return (
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
          src={profileData.image}
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
            bottom: 18,
            right: "37%",
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            '&:hover': { backgroundColor: theme.palette.primary.dark },
          }}
        >
          <input hidden accept=".jpg,.jpeg,.png" type="file" onChange={handleImageUpload} />
          <AddAPhotoIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" mt={2}>
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
              error={!!errors.displayName}
              helperText={errors.displayName}
            />
          ) : (
            <Typography variant="body1">{profileData.displayName}</Typography>
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
              error={!!errors.email}
              helperText={errors.email}
            />
          ) : (
            <Typography variant="body1">{profileData.email}</Typography>
          )}
        </Grid>

        {/* Phone Number Field */}
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
              error={!!errors.phone_no}
              helperText={errors.phone_no}
            />
          ) : (
            <Typography variant="body1">{profileData.phone_no}</Typography>
          )}
        </Grid>

        {/* Role Field */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Role:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="role"
              value={profileData.role}
              InputProps={{ readOnly: true }}
              onChange={handleInputChange}
            />
          ) : (
            <Typography variant="body1">{profileData.role}</Typography>
          )}
        </Grid>

        {/* Address Field */}
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
            />
          ) : (
            <Typography variant="body1">{profileData.address}</Typography>
          )}
        </Grid>

        {/* DOB Field */}
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Date of Birth:
          </Typography>
          {editMode ? (
            <TextField
              fullWidth
              name="dob"
              value={profileData.dob}
              InputProps={{ readOnly: true }}
              onChange={handleInputChange}
            />
          ) : (
            <Typography variant="body1">{profileData.dob}</Typography>
          )}
        </Grid>

        {/* Change Password Section */}
        {changePasswordMode && (
          <>
            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary">
                Current Password:
              </Typography>
              <TextField
                fullWidth
                name="currentPassword"
                type={passwordVisibility ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary">
                New Password:
              </Typography>
              <TextField
                fullWidth
                name="newPassword"
                type={passwordVisibility ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary">
                Confirm Password:
              </Typography>
              <TextField
                fullWidth
                name="confirmPassword"
                type={passwordVisibility ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>

            {/* Password Visibility Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={passwordVisibility}
                    onChange={() => setPasswordVisibility(!passwordVisibility)}
                  />
                }
                label="Show Passwords"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handlePasswordSave}
                disabled={!!errors.newPassword || !!errors.confirmPassword}
              >
                Save Password
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      <Box mt={3} display="flex" justifyContent="space-between">
        {!editMode && (
          <Button variant="contained" color="error" onClick={handleUpdateClick}>
            Edit Profile
          </Button>
        )}
        {editMode && (
          <Button variant="contained" color="success" onClick={handleSave}>
            Save Changes
          </Button>
        )}
        {editMode && (
          <Button variant="contained" color="error" onClick={()=>{setEditMode(false)}}>
            Cancel
          </Button>
        )}
        {!changePasswordMode && (
          <Button variant="outlined" color="secondary" onClick={handlePasswordChange}>
            Change Password
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default MyProfile;
