import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  TextField,
  Button,
  Alert,
  Fade,
  Grow,
  Paper,
  Rating,
} from '@mui/material';
import {
  Place,
  AccessTime,
  Language,
  LocalActivity,
  Restaurant,
  Event,
  AttachMoney,
  Star,
  Favorite,
  LocalOffer,
  Info,
  Lightbulb,
  DirectionsWalk,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { generateContent } from '../../services/geminiAPI';
import Swal from 'sweetalert2';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(1),
}));

const PriceChip = styled(Chip)(({ theme }) => ({
  background: theme.palette.success.light,
  color: theme.palette.success.contrastText,
}));

const RatingChip = styled(Chip)(({ theme }) => ({
  background: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const TravelGuide = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const getNearbyPlaces = async (location) => {
    if (!location) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, try to get the correct location name
      const correctionPrompt = `Given the location "${location}", return ONLY the correct location name as a JSON object with this structure: {"correctedLocation": "correct name"}. If it's already correct, return the same name. Example: for "New Yrok" return {"correctedLocation": "New York"}`;
      
      const correctionResult = await generateContent(correctionPrompt, GEMINI_API_KEY);
      
      if (correctionResult.error) {
        throw new Error(correctionResult.message);
      }

      const correctedLocation = correctionResult.correctedLocation;

      // If location was corrected, show a notification
      if (correctedLocation.toLowerCase() !== location.toLowerCase()) {
        Swal.fire({
          icon: 'info',
          title: 'Location Corrected',
          text: `Showing results for "${correctedLocation}" instead of "${location}"`,
          showConfirmButton: false,
          timer: 2000
        });
        setLocation(correctedLocation); // Update the input field
      }

      // Now get the travel information with the corrected location
      const prompt = `Act as a local tour guide and provide comprehensive information about ${correctedLocation}. 
                     Return ONLY a JSON object with the following structure:
                     {
                       "nearbyAttractions": [{"name": "", "description": "", "type": "", "bestTime": "", "rating": "", "ticketPrice": "", "tips": ""}],
                       "localFood": [{"name": "", "description": "", "where": "", "price": "", "mustTry": boolean}],
                       "events": [{"name": "", "time": "", "description": "", "venue": ""}],
                       "practicalInfo": {"bestTimeToVisit": "", "weather": "", "localTransport": "", "safety": ""},
                       "culturalTips": [""],
                       "hiddenGems": [{"name": "", "description": "", "why": ""}]
                     }`;
      
      const result = await generateContent(prompt, GEMINI_API_KEY);
      
      if (result.error) {
        throw new Error(result.message);
      }
      
      setNearbyPlaces(result);
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Failed to fetch location information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Fade in timeout={1000}>
        <Typography variant="h4" gutterBottom sx={{
          textAlign: 'center',
          color: 'primary.main',
          fontWeight: 'bold',
          mb: 4
        }}>
          <LocalActivity sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Travel Guide
        </Typography>
      </Fade>

      <Grow in timeout={500}>
        <StyledCard sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Enter Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Paris, France"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => getNearbyPlaces(location)}
                  disabled={loading}
                >
                  Explore Location
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
      </Grow>

      {error && (
        <Fade in>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : nearbyPlaces && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3}>
            {/* Nearby Attractions */}
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <StyledCard>
                  <CardContent>
                    <IconWrapper>
                      <LocalActivity sx={{ mr: 1 }} />
                      <Typography variant="h5">Nearby Attractions</Typography>
                    </IconWrapper>
                    <Grid container spacing={2}>
                      {nearbyPlaces.nearbyAttractions.map((attraction, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                              <Typography variant="h6" color="primary">
                                {attraction.name}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {attraction.description}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <PriceChip
                                  icon={<AttachMoney />}
                                  label={attraction.ticketPrice}
                                  size="small"
                                />
                                <RatingChip
                                  icon={<Star />}
                                  label={`${attraction.rating}/5`}
                                  size="small"
                                />
                              </Box>
                            </Paper>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Grid>

            {/* Local Food */}
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <IconWrapper>
                    <Restaurant sx={{ mr: 1 }} />
                    <Typography variant="h5">Local Cuisine</Typography>
                  </IconWrapper>
                  {nearbyPlaces.localFood.map((food, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6">{food.name}</Typography>
                      <Typography variant="body2" paragraph>
                        {food.description}
                      </Typography>
                      <Typography variant="body2">
                        Where to try: {food.where}
                      </Typography>
                      <Typography variant="body2">
                        Price: {food.price}
                      </Typography>
                      {food.mustTry && (
                        <Chip 
                          label="Must Try!" 
                          color="primary" 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  ))}
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Events and Practical Info */}
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ mb: 2 }}>
                <CardContent>
                  <IconWrapper>
                    <Event sx={{ mr: 1 }} />
                    <Typography variant="h5">Upcoming Events</Typography>
                  </IconWrapper>
                  {nearbyPlaces.events.map((event, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="h6">{event.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {event.time} at {event.venue}
                      </Typography>
                      <Typography variant="body2">
                        {event.description}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </StyledCard>

              <StyledCard>
                <CardContent>
                  <IconWrapper>
                    <Info sx={{ mr: 1 }} />
                    <Typography variant="h5">Practical Information</Typography>
                  </IconWrapper>
                  <Typography variant="h6" gutterBottom>
                    Best Time to Visit
                  </Typography>
                  <Typography paragraph>
                    {nearbyPlaces.practicalInfo.bestTimeToVisit}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom>
                    Weather
                  </Typography>
                  <Typography paragraph>
                    {nearbyPlaces.practicalInfo.weather}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    Local Transport
                  </Typography>
                  <Typography paragraph>
                    {nearbyPlaces.practicalInfo.localTransport}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    Safety Tips
                  </Typography>
                  <Typography>
                    {nearbyPlaces.practicalInfo.safety}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Hidden Gems */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <IconWrapper>
                    <Lightbulb sx={{ mr: 1 }} />
                    <Typography variant="h5">Hidden Gems</Typography>
                  </IconWrapper>
                  <Grid container spacing={2}>
                    {nearbyPlaces.hiddenGems.map((gem, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                          <Typography variant="h6">{gem.name}</Typography>
                          <Typography variant="body2" paragraph>
                            {gem.description}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            Why visit: {gem.why}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Cultural Tips */}
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <IconWrapper>
                    <Favorite sx={{ mr: 1 }} />
                    <Typography variant="h5">Cultural Tips</Typography>
                  </IconWrapper>
                  <Grid container spacing={2}>
                    {nearbyPlaces.culturalTips.map((tip, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Typography>• {tip}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </Box>
  );
};

export default TravelGuide;