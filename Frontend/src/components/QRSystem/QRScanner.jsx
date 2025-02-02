import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}));

const QRScanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scanner, setScanner] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initializeScanner();
    return () => {
      if (scanner) {
        scanner.stop();
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      const newScanner = new QrScanner(
        videoRef.current,
        async result => {
          await handleScanResult(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      setScanner(newScanner);
      await newScanner.start();
    } catch (err) {
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      console.error('Scanner initialization error:', err);
    }
  };

  const handleScanResult = async (qrData) => {
    if (!loading) {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API}/user/qr/process`,
          {
            qrData: qrData,
            timestamp: new Date().toISOString()
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          setSuccess(response.data.message);
          playSound('success');
          if (scanner) {
            scanner.stop();
          }
          
          // Navigate to home after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Failed to process QR code');
        }
      } catch (err) {
        console.error('QR Processing Error:', err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to process QR code. Please try again.'
        );
        playSound('error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await QrScanner.scanImage(file);
      await handleScanResult(result);
    } catch (error) {
      setError('Could not detect QR code in image. Please try another image.');
      playSound('error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const playSound = (type) => {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(console.error);
  };

  const resetScanner = async () => {
    setError(null);
    setSuccess(null);
    if (scanner) {
      await scanner.start();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="sm">
      <StyledPaper>
        <Typography variant="h5" gutterBottom align="center">
          QR Code Scanner
        </Typography>

        <Box sx={{ mb: 3 }}>
          <video 
            ref={videoRef}
            style={{ 
              width: '100%',
              borderRadius: '8px',
              maxHeight: '350px',
              objectFit: 'cover'
            }}
          />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Position the QR code within the frame
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="qr-file-input"
          />
          <label htmlFor="qr-file-input">
            <Button
              variant="outlined"
              component="span"
              sx={{ mx: 1 }}
            >
              Upload Image
            </Button>
          </label>
        </Box>

        {loading && (
          <Stack alignItems="center" spacing={2} sx={{ my: 3 }}>
            <CircularProgress />
            <Typography>Processing QR Code...</Typography>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Redirecting to home page...
            </Typography>
          </Alert>
        )}

        {(error || success) && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={resetScanner}
              color="primary"
            >
              Scan Again
            </Button>
          </Box>
        )}
      </StyledPaper>
    </Container>
  );
};

export default QRScanner;