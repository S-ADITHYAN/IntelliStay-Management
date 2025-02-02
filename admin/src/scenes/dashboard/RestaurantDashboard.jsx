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
  RestaurantMenu,
  AttachMoney,
  TableChart,
  Assessment,
  TrendingUp,
  People,
  TableBar,
} from '@mui/icons-material';
import StatBox from '../../components/StatBox';
import LineChart from '../../components/LineChart';
import PieChart from '../../components/PieChart';
import BarChart from '../../components/BarChart';
import InteractiveChart from '../../components/InteractiveChart';

const RestaurantDashboard = ({ stats, colors }) => {
  // Add default values and safe checks
  const {
    todayOrders = { total: 0, byStatus: {} },
    monthlyRevenue = 0,
    popularDishes = [],
    tableUtilization = [],
    revenueData = []
  } = stats?.restaurantMetrics || {};

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

  // Transform popular dishes for pie chart
  const dishesData = popularDishes.map(dish => ({
    id: dish.name || 'Unknown',
    label: dish.name || 'Unknown',
    value: dish.count || 0
  }));

  // Transform table utilization for bar chart
  const tableData = tableUtilization.map(table => ({
    tableId: `Table ${table.tableId || 'Unknown'}`,
    utilization: Number((table.utilizationRate || 0).toFixed(1))
  }));

  return (
    <Grid container spacing={3}>
      {/* Stats Row */}
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={todayOrders.total || 0}
          subtitle="Today's Orders"
          progress={0.65}
          increase="+21%"
          icon={<RestaurantMenu sx={{ fontSize: "26px" }} />}
        />
      </Grid>
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
          title={tableUtilization.length}
          subtitle="Active Tables"
          progress={0.80}
          increase="+5%"
          icon={<TableBar sx={{ fontSize: "26px" }} />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title={popularDishes.length}
          subtitle="Popular Items"
          progress={0.70}
          increase="+10%"
          icon={<TrendingUp sx={{ fontSize: "26px" }} />}
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
              Popular Dishes
            </Typography>
            <Box height={400}>
              <PieChart data={dishesData} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Table Utilization */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Table Utilization
            </Typography>
            <Box height={300}>
              <BarChart data={tableData.map(table => ({
                x: table.tableId,
                y: table.utilization
              }))} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Popular Dishes Details */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Popular Dishes Details
            </Typography>
            <Grid container spacing={2}>
              {popularDishes.map((dish, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    bgcolor="background.paper"
                    p={2}
                    borderRadius={1}
                    boxShadow={1}
                  >
                    <Typography variant="h6">{dish.name || 'Unknown'}</Typography>
                    <Typography>
                      Orders: {dish.count || 0}
                    </Typography>
                    <Typography>
                      Revenue: {formatCurrency(dish.revenue)}
                    </Typography>
                    <Typography>
                      Avg. Order Value: {formatCurrency(dish.averageOrderValue)}
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

export default RestaurantDashboard;