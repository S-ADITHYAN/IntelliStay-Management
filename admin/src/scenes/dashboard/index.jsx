import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  Hotel,
  AttachMoney,
  Person,
  Restaurant,
  CleaningServices,
  Event,
  Build,
  Group,
  RoomService,
  Assessment,
  DownloadOutlined,
} from '@mui/icons-material';
import StatBox from '../../components/StatBox';
import LineChart from '../../components/LineChart';
import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';
import Header from '../../components/Header';
import HotelDashboard from './HotelDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import { CSVLink } from 'react-csv';
import axios from 'axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [dashboardData, setDashboardData] = useState({
    hotelMetrics: {
      roomStats: {},
      financialStats: {},
      staffStats: {},
      maintenanceStats: {},
      guestStats: {},
    },
    restaurantMetrics: {}
  });

  // Theme colors
  const colors = {
    grey: {
      100: '#e0e0e0',
      200: '#c2c2c2'
    },
    blueAccent: {
      700: '#1976d2',
      800: '#1565c0'
    },
    secondary: {
      main: '#9c27b0'
    }
  };

  // Time range selector component
  const TimeRangeSelector = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      {['week', 'month', 'year'].map((range) => (
        <Button
          key={range}
          variant={value === range ? 'contained' : 'outlined'}
          onClick={() => onChange(range)}
          sx={{
            textTransform: 'capitalize',
            color: value === range ? colors.grey[100] : 'inherit',
            backgroundColor: value === range ? colors.blueAccent[700] : 'transparent',
            '&:hover': {
              backgroundColor: value === range ? colors.blueAccent[800] : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {range}
        </Button>
      ))}
    </Box>
  );

  // Generate CSV report data
  const generateReportData = (type) => {
    const metrics = type === 'hotel' ? dashboardData.hotelMetrics : dashboardData.restaurantMetrics;
    return {
      filename: `${type}-report-${new Date().toISOString().split('T')[0]}.csv`,
      data: Object.entries(metrics).map(([key, value]) => ({
        metric: key,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      })),
      headers: [
        { label: 'Metric', key: 'metric' },
        { label: 'Value', key: 'value' }
      ]
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API}/api/admin/dashboard-stats`, {
        params: { timeRange: selectedTimeRange },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data) {
        setDashboardData({
          hotelMetrics: {
            roomStats: response.data.roomStats || {},
            financialStats: response.data.financialStats || {},
            staffStats: response.data.staffStats || {},
            maintenanceStats: response.data.maintenanceStats || {},
            guestStats: response.data.guestStats || {}
          },
          restaurantMetrics: response.data.restaurantStats || {}
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error" variant="h5">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Welcome to your hotel & restaurant analytics" />
        
        <Box>
          <CSVLink {...generateReportData(activeTab === 0 ? 'hotel' : 'restaurant')}>
            <Button
              sx={{
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
                fontSize: "14px",
                fontWeight: "bold",
                padding: "10px 20px",
                "&:hover": {
                  backgroundColor: colors.blueAccent[800],
                },
              }}
            >
              <DownloadOutlined sx={{ mr: "10px" }} />
              Download Report
            </Button>
          </CSVLink>
        </Box>
      </Box>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          textColor="secondary"
          indicatorColor="secondary"
          sx={{
            '& .MuiTab-root': {
              color: colors.grey[200],
              '&.Mui-selected': {
                color: colors.secondary.main
              }
            }
          }}
        >
          <Tab icon={<Hotel />} label="Hotel" />
          <Tab icon={<Restaurant />} label="Restaurant" />
        </Tabs>
      </Box>

      {/* TIME RANGE SELECTOR */}
      <TimeRangeSelector 
        value={selectedTimeRange}
        onChange={setSelectedTimeRange}
      />

      {/* DASHBOARD CONTENT */}
      <Box mt={3}>
        {activeTab === 0 ? (
          <HotelDashboard 
            data={dashboardData.hotelMetrics}
            timeRange={selectedTimeRange}
          />
        ) : (
          <RestaurantDashboard 
            data={dashboardData.restaurantMetrics}
            timeRange={selectedTimeRange}
          />
        )}
      </Box>
    </Box>
  );
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount || 0);
};

export default Dashboard;