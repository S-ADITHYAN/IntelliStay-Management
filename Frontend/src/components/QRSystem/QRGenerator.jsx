import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import axios from 'axios';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const QRGenerator = ({ reservationId }) => {
  const [qrData, setQrData] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reservationData, setReservationData] = useState(null);

  useEffect(() => {
    fetchReservationDetails();
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      const user_id = localStorage.getItem('userId');
      console.log("user_id", user_id);
      
      const config = {
        headers: {
          'user_id': user_id
        }
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API}/user/reservations/${reservationId}`,
        config
      );

      console.log("Reservation response:", response.data);
      if (response.data.success) {
        setReservationData(response.data.data);
      } else {
        setError('Failed to fetch reservation details');
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
      setError('Failed to fetch reservation details');
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/user/qr/generate`, {
        reservationId,
        timestamp: new Date().toISOString()
      });
      setQrData(response.data.qrCode);
      setShowQR(true);
    } catch (error) {
      setError('Failed to generate QR code');
    }
    setLoading(false);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${reservationId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Container maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StyledCard>
          <Typography variant="h5" gutterBottom>
            Self Check-{reservationData?.status === 'checked_in' ? 'Out' : 'In'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {reservationData && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Room: {reservationData.roomDetails?.roomNumber || 'N/A'}
              </Typography>
              <Typography variant="body1">
                Check-in: {reservationData.dates?.checkIn ? new Date(reservationData.dates.checkIn).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body1">
                Check-out: {reservationData.dates?.checkOut ? new Date(reservationData.dates.checkOut).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={generateQRCode}
            disabled={loading || !reservationData}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Generate QR Code for Check-${reservationData?.status === 'checked_in' ? 'Out' : 'In'}`
            )}
          </Button>

          <Dialog open={showQR} onClose={() => setShowQR(false)}>
            <DialogTitle>
              Scan this QR Code at the Self-Service Kiosk
            </DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 3,
                  background: '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <QRCodeSVG
                  id="qr-code"
                  value={qrData}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </Box>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Please scan this QR code at our self-service kiosk to complete your check-{reservationData?.status === 'checked_in' ? 'out' : 'in'}.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={downloadQRCode}>
                Download QR Code
              </Button>
              <Button onClick={() => setShowQR(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </StyledCard>
      </motion.div>
    </Container>
  );
};

export default QRGenerator; 