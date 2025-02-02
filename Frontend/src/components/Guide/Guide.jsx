import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Fade,
  Divider,
} from '@mui/material';
import {
  Place,
  DirectionsTransit,
  ExploreOutlined,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import TravelGuide from '../TravelGuide/TravelGuide';
import TransportInfo from '../TravelGuide/TransportInfo';
import Header from '../../../components/Header';
import './Guide.css';



// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: 1.5,
  },
  '& .MuiTab-root': {
    minHeight: 64,
    fontSize: '1rem',
    textTransform: 'none',
    fontWeight: 500,
    transition: 'all 0.3s',
    '&:hover': {
      color: theme.palette.primary.main,
      opacity: 1,
    },
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`travel-tabpanel-${index}`}
    aria-labelledby={`travel-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Fade in timeout={500}>
        <Box sx={{ pt: 3 }}>{children}</Box>
      </Fade>
    )}
  </div>
);

const Guide = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
    <div className='menunav'>
      <Header title="Guest Information" subtitle="Fill in guest details" />
    </div>
    <Container maxWidth="xl">
      <Divider sx={{ my: 4 }} />
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <StyledPaper elevation={3}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <ExploreOutlined 
              sx={{ 
                fontSize: 40, 
                color: 'primary.main',
                mb: 2
              }} 
            />
            <Typography 
              variant="h4" 
              component="h2"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Travel Information
            </Typography>
          </Box>

          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<Place />} 
              label="Tourist Spots" 
              sx={{ 
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                '& .MuiSvgIcon-root': {
                  mr: 1
                }
              }}
            />
            <Tab 
              icon={<DirectionsTransit />} 
              label="Transport"
              sx={{ 
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                '& .MuiSvgIcon-root': {
                  mr: 1
                }
              }}
            />
          </StyledTabs>

          <TabPanel value={activeTab} index={0}>
            <TravelGuide />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TransportInfo />
          </TabPanel>
        </StyledPaper>
      </motion.div>
    </Container>
    </>
  );
};

export default Guide; 