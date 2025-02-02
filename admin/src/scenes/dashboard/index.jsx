import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import {
  DownloadOutlined,
  TrendingUp,
  Hotel,
  Restaurant,
  Person,
  EventAvailable,
  AttachMoney,
  TableChart,
  Room,
  RestaurantMenu,
  Assessment,
  Schedule,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import LineChart from "../../components/LineChart";
import PieChart from "../../components/PieChart";
import BarChart from "../../components/BarChart";
import { CSVLink } from "react-csv";
import axios from "axios";
import { format } from "date-fns";
import InteractiveChart from '../../components/InteractiveChart';
import DetailedMetrics from '../../components/DetailedMetrics';
import HotelDashboard from './HotelDashboard';
import RestaurantDashboard from './RestaurantDashboard';

const Dashboard = () => {
  const theme = useTheme();
  const defaultColors = {
    grey: { 100: '#e0e0e0' },
    blueAccent: { 700: '#1976d2', 800: '#1565c0' },
    primary: { 400: '#42a5f5' },
    greenAccent: { 600: '#43a047' }
  };

  const colors = tokens(theme.palette.mode) || defaultColors;

  const [activeTab, setActiveTab] = useState(0);
  const [revenueData, setRevenueData] = useState([{
    id: 'revenue',
    data: [
      { x: new Date().toISOString(), y: 0 }
    ]
  }]);
  const [stats, setStats] = useState({
    hotelMetrics: {
      roomStatus: { total: 0, occupied: 0, available: 0, maintenance: 0 },
      monthlyRevenue: 0,
      occupancyRate: 0,
      averageRevenue: 0,
      popularRoomTypes: [],
      revenueData: []
    },
    restaurantMetrics: {
      todayOrders: 0,
      monthlyRevenue: 0,
      tableUtilization: [],
      popularDishes: [],
      revenueData: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  const TimeRangeSelector = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {['week', 'month', 'year'].map((range) => (
        <Button
          key={range}
          variant={value === range ? 'contained' : 'outlined'}
          onClick={() => onChange(range)}
          sx={{
            textTransform: 'capitalize',
            color: value === range ? colors?.grey?.[100] : 'inherit',
            backgroundColor: value === range ? colors?.blueAccent?.[700] : 'transparent',
            '&:hover': {
              backgroundColor: value === range ? colors?.blueAccent?.[800] : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {range}
        </Button>
      ))}
    </Box>
  );

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const transformRevenueData = (rawData = []) => {
    if (!Array.isArray(rawData)) return [];

    const transformedData = rawData.map(item => ({
      x: item.date || item._id,
      y: Number(item.amount) || 0
    })).filter(item => item.x && item.y !== undefined);

    return transformedData.length > 0 ? [{
      id: 'revenue',
      data: transformedData
    }] : [];
  };

  const fetchDashboardData = async (timeRange = selectedTimeRange) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API}/admin/dashboard-stats`, {
        params: { timeRange }

      });
      console.log(response.data);

      
      if (response.data.success) {
        setStats(response.data);
        setRevenueData(transformRevenueData(response.data.revenueData));
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
      // Set default data on error
      setRevenueData(transformRevenueData([]));
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (type) => {
    const metrics = type === 'hotel' ? stats.hotelMetrics : stats.restaurantMetrics;
    return {
      filename: `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      data: Object.entries(metrics || {}).map(([key, value]) => ({
        metric: key,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      })),
      headers: [
        { label: 'Metric', key: 'metric' },
        { label: 'Value', key: 'value' }
      ]
    };
  };

  const handleTimeRangeChange = async (range) => {
    setSelectedTimeRange(range);
    await fetchDashboardData();
  };

  const handleComparisonToggle = () => {
    setComparisonMode(!comparisonMode);
  };

  const getDetailedMetrics = () => {
    return {
      hotel: [
        {
          label: 'Revenue per Available Room',
          value: `₹${(stats.hotelMetrics.monthlyRevenue / stats.hotelMetrics.roomStatus.total).toFixed(2)}`,
          percentage: 85,
          trend: 'up',
          info: 'Average revenue generated per available room'
        },
        // Add more hotel metrics
      ],
      restaurant: [
        {
          label: 'Average Order Value',
          value: `₹${(stats.restaurantMetrics.monthlyRevenue / stats.restaurantMetrics.todayOrders).toFixed(2)}`,
          percentage: 72,
          trend: 'up',
          info: 'Average amount spent per order'
        },
        // Add more restaurant metrics
      ]
    };
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
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
                backgroundColor: colors?.blueAccent?.[700] || defaultColors.blueAccent[700],
                color: colors?.gray?.[100] || defaultColors.grey[100],
                fontSize: "14px",
                fontWeight: "bold",
                padding: "10px 20px",
                "&:hover": {
                  backgroundColor: colors?.blueAccent?.[800] || defaultColors.blueAccent[800],
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
        >
          <Tab icon={<Hotel />} label="Hotel" />
          <Tab icon={<Restaurant />} label="Restaurant" />
        </Tabs>
      </Box>

      {/* CONTENT */}
      <Box display={activeTab === 0 ? 'block' : 'none'}>
        <HotelDashboard 
          stats={stats.hotelMetrics} 
          colors={colors} 
          revenueData={revenueData}
        />
      </Box>

      <Box display={activeTab === 1 ? 'block' : 'none'}>
        <RestaurantDashboard 
          stats={stats.restaurantMetrics} 
          colors={colors}
          revenueData={revenueData}
        />
      </Box>

      {/* Add TimeRange Selector */}
      <Box sx={{ mb: 3 }}>
        <TimeRangeSelector 
          value={selectedTimeRange}
          onChange={handleTimeRangeChange}
        />
      </Box>

      {/* Add Detailed Metrics */}
      <DetailedMetrics 
        metrics={getDetailedMetrics()[activeTab === 0 ? 'hotel' : 'restaurant']}
        title={activeTab === 0 ? 'Hotel Analytics' : 'Restaurant Analytics'}
        type={activeTab === 0 ? 'hotel' : 'restaurant'}
      />

      {/* Add Interactive Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <LineChart 
            data={transformRevenueData(
              activeTab === 0 
                ? stats.hotelMetrics?.revenueData || []
                : stats.restaurantMetrics?.revenueData || []
            )}
            isDashboard={true}
          />
        </Grid>
        {/* Add more interactive charts */}
      </Grid>
    </Box>
  );
};

export default Dashboard;