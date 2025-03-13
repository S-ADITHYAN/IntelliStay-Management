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
} from '@mui/icons-material';
import StatBox from '../../components/StatBox';
import LineChart from '../../components/LineChart';
import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';

const HotelDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    roomStats: {},
    financialStats: {},
    staffStats: {},
    restaurantStats: {},
    maintenanceStats: {},
    guestStats: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/admin/dashboard-stats`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Revenue & Occupancy Stats */}
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={formatCurrency(dashboardData.financialStats?.totalRevenue)}
          subtitle="Total Revenue"
          progress={0.75}
          increase="+14%"
          icon={<AttachMoney />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={`${dashboardData.roomStats?.occupancyRate}%`}
          subtitle="Occupancy Rate"
          progress={dashboardData.roomStats?.occupancyRate / 100}
          increase={`${dashboardData.roomStats?.occupancyTrend}%`}
          icon={<Hotel />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={dashboardData.guestStats?.currentGuests}
          subtitle="Current Guests"
          progress={0.65}
          increase={`${dashboardData.guestStats?.guestTrend}%`}
          icon={<Person />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={dashboardData.restaurantStats?.dailyOrders}
          subtitle="Restaurant Orders"
          progress={0.80}
          increase={`${dashboardData.restaurantStats?.orderTrend}%`}
          icon={<Restaurant />}
        />
      </Grid>

      {/* Revenue Trend Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6">Revenue Trends</Typography>
            <Box height={300}>
              <LineChart 
                data={dashboardData.financialStats?.revenueData} 
                isDashboard={true}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Room Status Distribution */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Room Status</Typography>
            <Box height={300}>
              <PieChart data={dashboardData.roomStats?.statusDistribution} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Staff & Maintenance Section */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Staff Overview</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">Total Staff</Typography>
                <Typography variant="h4">{dashboardData.staffStats?.totalStaff}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">On Duty</Typography>
                <Typography variant="h4">{dashboardData.staffStats?.onDuty}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">On Leave</Typography>
                <Typography variant="h4">{dashboardData.staffStats?.onLeave}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Attendance Rate</Typography>
                <Typography variant="h4">{dashboardData.staffStats?.attendanceRate}%</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Restaurant Analytics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Restaurant Analytics</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">Today's Revenue</Typography>
                <Typography variant="h4">{formatCurrency(dashboardData.restaurantStats?.todayRevenue)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Popular Items</Typography>
                <Typography variant="body1">{dashboardData.restaurantStats?.popularItems?.join(', ')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Table Reservations</Typography>
                <Typography variant="h4">{dashboardData.restaurantStats?.tableReservations}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Pending Orders</Typography>
                <Typography variant="h4">{dashboardData.restaurantStats?.pendingOrders}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Maintenance & Housekeeping */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Maintenance & Housekeeping</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Pending Tasks</Typography>
                <Typography variant="h4">{dashboardData.maintenanceStats?.pendingTasks}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Rooms to Clean</Typography>
                <Typography variant="h4">{dashboardData.maintenanceStats?.roomsToClean}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Maintenance Requests</Typography>
                <Typography variant="h4">{dashboardData.maintenanceStats?.maintenanceRequests}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Completed Today</Typography>
                <Typography variant="h4">{dashboardData.maintenanceStats?.completedToday}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount || 0);
};

export default HotelDashboard;