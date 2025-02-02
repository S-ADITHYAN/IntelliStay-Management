import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Hotel,
  AttachMoney,
  TrendingUp,
  Room,
  Person,
  Assessment,
  MeetingRoom,
} from '@mui/icons-material';
import StatBox from '../../components/StatBox';
import LineChart from '../../components/LineChart';
import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';
import InteractiveChart from '../../components/InteractiveChart';

const HotelDashboard = ({ stats, colors }) => {
  // Add default values and safe checks
  const {
    roomStatus = {},
    monthlyRevenue = 0,
    occupancyRate = 0,
    popularRoomTypes = [],
    revenueData = []
  } = stats?.hotelMetrics || {};

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${Number(value || 0).toFixed(1)}%`;
  };

  // Transform room status for pie chart
  const roomStatusData = Object.entries(roomStatus).map(([status, data]) => ({
    id: status,
    label: status,
    value: data?.count || 0
  }));

  return (
    <Grid container spacing={3}>
      {/* Stats Row */}
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={formatCurrency(monthlyRevenue)}
          subtitle="Monthly Revenue"
          progress={0.75}
          increase="+14%"
          icon={<AttachMoney sx={{ fontSize: "26px" }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={formatPercentage(occupancyRate)}
          subtitle="Occupancy Rate"
          progress={occupancyRate / 100}
          increase={`${formatPercentage(occupancyRate)}`}
          icon={<Hotel sx={{ fontSize: "26px" }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={roomStatus?.occupied?.count || 0}
          subtitle="Occupied Rooms"
          progress={0.65}
          increase="+5%"
          icon={<MeetingRoom sx={{ fontSize: "26px" }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={roomStatus?.available?.count || 0}
          subtitle="Available Rooms"
          progress={0.50}
          increase="+8%"
          icon={<Person sx={{ fontSize: "26px" }} />}
        />
      </Grid>

      {/* Charts Row */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Revenue Trend
            </Typography>
            <Box height={400}>
              <LineChart 
                data={revenueData} 
                isDashboard={true}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Room Status Distribution
            </Typography>
            <Box height={400}>
              <PieChart data={roomStatusData} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Popular Room Types */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Popular Room Types
            </Typography>
            <Grid container spacing={2}>
              {popularRoomTypes.map((room, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    bgcolor="background.paper"
                    p={2}
                    borderRadius={1}
                    boxShadow={1}
                  >
                    <Typography variant="h6">{room.type || 'Unknown'}</Typography>
                    <Typography>
                      Bookings: {room.bookings || 0}
                    </Typography>
                    <Typography>
                      Revenue: {formatCurrency(room.revenue)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default HotelDashboard;