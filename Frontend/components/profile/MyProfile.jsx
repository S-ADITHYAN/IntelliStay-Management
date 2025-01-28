import React, { useState, useEffect, useCallback } from "react";
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
  FormHelperText
} from "@mui/material";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Swal from 'sweetalert2';
import Header from "../Header";
import './MyProfile.css'
import useAuth from "../../src/useAuth";

const MyProfile = () => {
  useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const theme = useTheme();
  const [userData, setUserData] = useState({_id:""});
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    address: "",
    image: "",
    role: "",
    phone_no: "",
    dob: ""
  });
  const [errors, setErrors] = useState({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const fetchProfileData = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/user/profile/${userId}`);
      const data = response.data;
      setProfileData({
        displayName: data.displayName || "",
        email: data.email || "",
        address: data.address || "",
        image: data.image || "",
        role: data.role || "",
        phone_no: data.phone_no || "",
        dob: data.dob || ""
      });
      setIsGoogleUser(!!data.googleId); // Set to true if googleId exists
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      Swal.fire("Error", "Failed to fetch profile data", "error");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken);
        fetchProfileData(decodedToken?._id);
      } catch (error) {
        console.error("Failed to decode token:", error);
        Swal.fire("Error", "Failed to authenticate", "error");
      }
    }
  }, [fetchProfileData]);

  const handleUpdateClick = () => {
    setEditMode(true);
  };

  const validateInput = (name, value) => {
    let error = "";
    switch (name) {
      case "displayName":
        if (!/^[a-zA-Z\s._]+$/.test(value)) {
          error = "Only letters, spaces, dots, and underscores are allowed";
        }
        break;
      case "phone_no":
        if (!/^\d{10}$/.test(value)) {
          error = "Phone number must be 10 digits";
        } else if (/(\d)\1{3,}/.test(value)) {
          error = "No more than 3 consecutive repeated digits allowed";
        }
        break;
      case "dob":
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          error = "Must be at least 18 years old";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateInput(name, value);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = () => {
    const newErrors = {};
    Object.keys(profileData).forEach(key => {
      const error = validateInput(key, profileData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    axios.post(`${import.meta.env.VITE_API}/user/profile/update/${userData._id}`, profileData)
      .then(response => {
        Swal.fire("Success", "Profile updated successfully", "success");
        setEditMode(false);
      })
      .catch(error => {
        Swal.fire("Error", "Error updating profile data", "error");
      });
  };

  const handlePasswordChange = () => {
    setChangePasswordMode(true);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$/;
    return regex.test(password);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Validate new password
    if (name === 'newPassword') {
      if (!validatePassword(value)) {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          newPassword: 'Password must be 6-50 characters long, include a letter, a number, and a special character'
        }));
      } else {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          newPassword: ''
        }));
      }
    }

    // Validate confirm password
    if (name === 'confirmPassword') {
      if (value !== passwordData.newPassword) {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          confirmPassword: ''
        }));
      }
    }
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prevErrors => ({
        ...prevErrors,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    if (!validatePassword(passwordData.newPassword)) {
      setPasswordErrors(prevErrors => ({
        ...prevErrors,
        newPassword: 'Password must be 6-50 characters long, include a letter, a number, and a special character'
      }));
      return;
    }

    axios.put(`${import.meta.env.VITE_API}/user/change-password/${userData._id}`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
    .then(response => {
      Swal.fire("Success", "Password changed successfully", "success");
      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    })
    .catch(error => {
      Swal.fire("Error", "Current password is incorrect or error updating password", "error");
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  
    const formData = new FormData();
    formData.append("image", file);
  
    axios.post(`${import.meta.env.VITE_API}/user/upload-photo/${userData._id}`, formData)
      .then(response => {
        Swal.fire("Success", "Profile image updated successfully", "success");
        setProfileData(prevData => ({
          ...prevData,
          image: response.data.image
        }));
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
        <Box display="flex" flexDirection="column" alignItems="center" mb={4} position="relative">
          <Avatar
            alt={profileData.displayName || "User"}
            src={profileData.image ? profileData.image : "/placeholder-avatar.png"}
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
              bottom: 28,
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

        <Grid container spacing={2}>
          {/* Name Field */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Name:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="displayName"
                  value={profileData.displayName || ""}
                  onChange={handleInputChange}
                  error={!!errors.displayName}
                  sx={{ color: theme.palette.text.primary }}
                />
                {errors.displayName && <FormHelperText error>{errors.displayName}</FormHelperText>}
              </>
            ) : (
              <Typography variant="h6">{profileData.displayName}</Typography>
            )}
          </Grid>

          {/* Email Field */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Email:
            </Typography>
           {editMode ? <TextField
              fullWidth
              name="email"
              value={profileData.email || ""}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
              sx={{ color: theme.palette.text.primary }}
            /> : <Typography variant="h6">{profileData.email}</Typography>}
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Phone Number:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="phone_no"
                  value={profileData.phone_no || ""}
                  onChange={handleInputChange}
                  error={!!errors.phone_no}
                  sx={{ color: theme.palette.text.primary }}
                />
                {errors.phone_no && <FormHelperText error>{errors.phone_no}</FormHelperText>}
              </>
            ) : (
              <Typography variant="h6">{profileData.phone_no}</Typography>
            )}
          </Grid>

          {/* Date of Birth */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Date of Birth:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="dob"
                  type="date"
                  value={profileData.dob || ""}
                  onChange={handleInputChange}
                  error={!!errors.dob}
                  sx={{ color: theme.palette.text.primary }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]
                  }}
                />
                {errors.dob && <FormHelperText error>{errors.dob}</FormHelperText>}
              </>
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
                value={profileData.address || ""}
                onChange={handleInputChange}
                sx={{ color: theme.palette.text.primary }}
              />
            ) : (
              <Typography variant="h6">{profileData.address}</Typography>
            )}
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} textAlign="center">
            {editMode ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ mt: 2, mr: 2 }}
                disabled={Object.keys(errors).some(key => errors[key])}
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

            {/* Change Password - Only show for non-Google users */}
            {!isGoogleUser && (
              !changePasswordMode ? (
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
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
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
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    sx={{ color: theme.palette.text.primary }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePasswordSave}
                    sx={{ mt: 2 }}
                    disabled={!!passwordErrors.newPassword || !!passwordErrors.confirmPassword}
                  >
                    Save Password
                  </Button>
                </Box>
              )
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default MyProfile;
