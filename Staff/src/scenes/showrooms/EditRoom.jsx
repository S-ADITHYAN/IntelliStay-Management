import { Box, Button, IconButton, TextField, useMediaQuery, useTheme } from "@mui/material";
import { Header } from "../../components";
import { Formik } from "formik";
import * as yup from "yup";
import { useState } from "react";
import axios from 'axios';
import Swal from 'sweetalert2';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const EditRoom = ({ roomData, onClose, onUpdateComplete }) => {
  const theme = useTheme();
  const isNonMobile = useMediaQuery("(min-width:600px)");

  // State for managing image display and update mode
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const imageBaseUrl = 'http://localhost:3001/uploads/'; 
  // When adding new images, handle both file uploads and existing images
// Assuming roomData.images contains the filenames of the images
const initialImages = roomData.images.map(image => image.replace(/^.*\/([^\/]+)$/, '$1'));
const [updatedImages, setUpdatedImages] = useState(initialImages.map(image => `${imageBaseUrl}${image}`));
console.log(updatedImages)

  const handleImageChange = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === updatedImages.length - 1 ? 0 : prevIndex + 1
      );
    } else {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? updatedImages.length - 1 : prevIndex - 1
      );
    }
  };

  const handleImageUpload = (event) => {
    const newImages = Array.from(event.target.files);
    setUpdatedImages([...updatedImages, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    const newImageList = updatedImages.filter((_, i) => i !== index);
    setUpdatedImages(newImageList);
  };

  const handleUpdateImages = () => {
    setIsUpdatingImages(true); // Open the image update mode
  };

  const initialValues = {
    roomno: roomData.roomno || "",
    roomtype: roomData.roomtype || "",
    status: roomData.status || "",
    rate: roomData.rate || "",
    description: roomData.description || "",
  };
  const rateRegExp = /^[0-9]+$/;

  const checkoutSchema = yup.object().shape({
    roomno: yup.string().required("required"),
    roomtype: yup.string().required("required"),
    status: yup.string().required("required"),
    rate: yup.string().matches(rateRegExp, "Rate is not valid. Only numbers are allowed").required("required"),
    description: yup.string().required("required"),
    images: yup.mixed().test('fileType', 'Only JPG, JPEG, and PNG files are allowed', (value) => {
      return value.every(file => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));
  })
  });

  const handleFormSubmit = (values) => {
    axios.post(`http://localhost:3001/updateroom/${roomData._id}`, { ...values, images: updatedImages })
      .then(res => {
        Swal.fire("Room updated successfully.");
        onUpdateComplete();
      })
      .catch(err => console.log(err));
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bgcolor="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      pr="5%"
    >
      <Box
        bgcolor={theme.palette.background.paper}
        p="20px"
        borderRadius="8px"
        width={isNonMobile ? "40%" : "80%"}
        maxWidth="400px"
        color={theme.palette.text.primary}
      >
        <Header title="EDIT ROOM" subtitle="Edit Room Details" />

        {/* Image Carousel */}
        {!isUpdatingImages && (
          <Box display="flex" alignItems="center" justifyContent="space-between" mb="20px">
            <IconButton onClick={() => handleImageChange('prev')}>
              <ArrowBackIosIcon />
            </IconButton>
            <img
  src={typeof updatedImages[currentImageIndex] === 'string' 
        ? updatedImages[currentImageIndex] 
        : URL.createObjectURL(updatedImages[currentImageIndex])}
  alt="Room"
  style={{ width: "100px", height: "100px", objectFit: "cover" }}
/>
            <IconButton onClick={() => handleImageChange('next')}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
        )}

        {/* Update Images Button */}
        <Button color="primary" onClick={handleUpdateImages} variant="contained" sx={{ mb: 2 }}>
          Update Images
        </Button>

        {/* Form */}
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
                  label="Room No"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.roomno}
                  name="roomno"
                  error={touched.roomno && errors.roomno}
                  helperText={touched.roomno && errors.roomno}
                  InputProps={{ readOnly: true }}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Room Type"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.roomtype}
                  name="roomtype"
                  error={touched.roomtype && errors.roomtype}
                  helperText={touched.roomtype && errors.roomtype}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Status"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.status}
                  name="status"
                  error={touched.status && errors.status}
                  helperText={touched.status && errors.status}
                  sx={{ gridColumn: "span 2" }}
                />
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
              </Box>
              <Box display="flex" justifyContent="end" mt="20px">
                <Button type="submit" color="secondary" variant="contained">
                  Update
                </Button>
                <Button onClick={onClose} color="primary" variant="contained" sx={{ ml: 2 }}>
                  Cancel
                </Button>
              </Box>
            </form>
          )}
        </Formik>

        {/* Update Images Section */}
        {isUpdatingImages && (
          <Box mt="20px">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              onChange={handleImageUpload}
            />
            <Box mt="10px">
              {updatedImages.map((image, index) => (
                <Box key={index} display="flex" alignItems="center" mb="10px">
                  <img src={image} alt="Preview" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                  <Button onClick={() => handleRemoveImage(index)} color="error" variant="contained" sx={{ ml: 2 }}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EditRoom;
