import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  useTheme,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from '@mui/material';
import { tokens } from '../../theme';
import { Header } from '../../components';
import GenerateMenuPDFButton from '../../components/GenerateMenuPDFButton';
import axios from 'axios';

const MenuManagement = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [menuItems, setMenuItems] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu-items');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handlePreviewAR = (itemId) => {
    // Use the Frontend URL for AR view
    const frontendUrl = window.location.origin.replace(':5174', ':5173');
    const arViewUrl = `${frontendUrl}/restaurant/ar-view/${itemId}`;
    window.open(arViewUrl, '_blank'); // Open in new tab instead of iframe
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="MENU MANAGEMENT" subtitle="Manage Restaurant Menu Items" />
        <Box>
          <GenerateMenuPDFButton menuItems={menuItems} />
        </Box>
      </Box>

      {/* Menu Items List */}
      <Grid container spacing={2}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Box
              bgcolor={colors.primary[400]}
              p={2}
              borderRadius={2}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">{item.name}</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handlePreviewAR(item.id)}
                >
                  Preview AR
                </Button>
              </Box>
              <Typography>{item.description}</Typography>
              <Typography variant="h6">₹{item.price}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* AR Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AR View Preview</DialogTitle>
        <DialogContent>
          <iframe
            src={previewUrl}
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
            }}
            title="AR Preview"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MenuManagement; 