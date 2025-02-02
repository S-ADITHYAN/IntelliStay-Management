import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Train,
  Flight,
  DirectionsBus,
  DirectionsCar,
  AccessTime,
  AttachMoney,
  Warning,
  Info,
  LocationOn,
} from '@mui/icons-material';
import { generateContent } from '../../services/geminiAPI';
import Swal from 'sweetalert2';

const TransportInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [transportInfo, setTransportInfo] = useState(null);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const getTransportInfo = async () => {
    if (!from || !to) {
      setError('Please enter both locations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, correct both location names
      const correctionPrompt = `Given the locations "from: ${from}" and "to: ${to}", return ONLY a JSON object with correct location names in this structure: {"fromLocation": "correct from name", "toLocation": "correct to name"}. If names are already correct, return the same names. Example: for "New Yrok" to "Washingten" return {"fromLocation": "New York", "toLocation": "Washington"}`;
      
      const correctionResult = await generateContent(correctionPrompt, GEMINI_API_KEY);
      
      if (correctionResult.error) {
        throw new Error(correctionResult.message);
      }

      const correctedFrom = correctionResult.fromLocation;
      const correctedTo = correctionResult.toLocation;

      // Show correction notification if either location was corrected
      if (correctedFrom.toLowerCase() !== from.toLowerCase() || 
          correctedTo.toLowerCase() !== to.toLowerCase()) {
        Swal.fire({
          icon: 'info',
          title: 'Locations Corrected',
          html: `Showing results for:<br>
                ${from !== correctedFrom ? `<b>From:</b> "${correctedFrom}" (corrected from "${from}")<br>` : ''}
                ${to !== correctedTo ? `<b>To:</b> "${correctedTo}" (corrected from "${to}")` : ''}`,
          showConfirmButton: true,
          timer: 3000
        });
        
        // Update the input fields
        setFrom(correctedFrom);
        setTo(correctedTo);
      }

      // Get transport information with corrected locations
      const prompt = `Act as a comprehensive transport guide and provide information about traveling from ${correctedFrom} to ${correctedTo}. 
                     Return ONLY a JSON object with the following structure:
                     {
                       "flights": [{"duration": "", "priceRange": "", "airlines": "", "frequency": "", "bestTimeToBook": "", "terminalTips": ""}],
                       "trains": [{"duration": "", "priceRange": "", "trainTypes": "", "frequency": "", "stationInfo": "", "amenities": ""}],
                       "buses": [{"duration": "", "priceRange": "", "operators": "", "frequency": "", "comfort": "", "stops": ""}],
                       "driving": {"duration": "", "distance": "", "routeHighlights": [], "roadConditions": "", "restStops": "", "tollInfo": ""},
                       "generalTips": [""],
                       "seasonalInfo": {"peak": "", "offPeak": "", "weatherConsiderations": ""}
                     }`;
      
      const result = await generateContent(prompt, GEMINI_API_KEY);
      
      if (result.error) {
        throw new Error(result.message);
      }
      
      setTransportInfo(result);
    } catch (error) {
      console.error('Error fetching transport information:', error);
      setError('Failed to fetch transport information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Transport Guide
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g., London"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g., Paris"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={getTransportInfo}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                Search Routes
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : transportInfo && (
        <Grid container spacing={3}>
          {/* Flights Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Flight sx={{ mr: 1 }} />
                  Flights
                </Typography>
                {transportInfo.flights.map((flight, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6">Option {index + 1}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Duration</Typography>
                        <Typography>{flight.duration}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Price Range</Typography>
                        <Typography>{flight.priceRange}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Airlines</Typography>
                        <Typography>{flight.airlines}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Frequency</Typography>
                        <Typography>{flight.frequency}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Chip 
                          icon={<Info />} 
                          label={`Best Time to Book: ${flight.bestTimeToBook}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                          💡 Terminal Tip: {flight.terminalTips}
                        </Typography>
                      </Grid>
                    </Grid>
                    {index < transportInfo.flights.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Trains Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Train sx={{ mr: 1 }} />
                  Trains
                </Typography>
                {transportInfo.trains.map((train, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6">Option {index + 1}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Duration</Typography>
                        <Typography>{train.duration}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Price Range</Typography>
                        <Typography>{train.priceRange}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Train Types</Typography>
                        <Typography>{train.trainTypes}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Frequency</Typography>
                        <Typography>{train.frequency}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Station Info</Typography>
                        <Typography>{train.stationInfo}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Amenities</Typography>
                        {train.amenities.split(',').map((amenity, i) => (
                          <Chip 
                            key={i}
                            label={amenity.trim()}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Grid>
                    </Grid>
                    {index < transportInfo.trains.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Buses Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DirectionsBus sx={{ mr: 1 }} />
                  Buses
                </Typography>
                {transportInfo.buses.map((bus, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6">Option {index + 1}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Duration</Typography>
                        <Typography>{bus.duration}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Price Range</Typography>
                        <Typography>{bus.priceRange}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Operators</Typography>
                        <Typography>{bus.operators}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Frequency</Typography>
                        <Typography>{bus.frequency}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Comfort Level</Typography>
                        <Typography>{bus.comfort}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Stops</Typography>
                        <Typography>{bus.stops}</Typography>
                      </Grid>
                    </Grid>
                    {index < transportInfo.buses.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Driving Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DirectionsCar sx={{ mr: 1 }} />
                  Driving
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Duration</Typography>
                    <Typography>{transportInfo.driving.duration}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Distance</Typography>
                    <Typography>{transportInfo.driving.distance}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Route Highlights</Typography>
                    {transportInfo.driving.routeHighlights.map((highlight, index) => (
                      <Chip
                        key={index}
                        icon={<LocationOn />}
                        label={highlight}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Road Conditions</Typography>
                    <Typography>{transportInfo.driving.roadConditions}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Rest Stops</Typography>
                    <Typography>{transportInfo.driving.restStops}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Toll Information</Typography>
                    <Typography>{transportInfo.driving.tollInfo}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* General Tips */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Travel Tips
                </Typography>
                <Grid container spacing={2}>
                  {transportInfo.generalTips.map((tip, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <Info sx={{ mr: 1, color: 'primary.main' }} />
                        {tip}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Seasonal Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Seasonal Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6">Peak Season</Typography>
                    <Typography>{transportInfo.seasonalInfo.peak}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6">Off-Peak Season</Typography>
                    <Typography>{transportInfo.seasonalInfo.offPeak}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6">Weather Considerations</Typography>
                    <Typography>{transportInfo.seasonalInfo.weatherConsiderations}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TransportInfo;