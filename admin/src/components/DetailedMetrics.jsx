import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MetricCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const DetailedMetrics = ({ metrics, title, type }) => {
  const renderMetric = (metric) => {
    const { label, value, percentage, trend, info } = metric;
    
    return (
      <Grid item xs={12} md={6} lg={4} key={label}>
        <MetricCard>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" color="textSecondary">
                {label}
              </Typography>
              <Tooltip title={info}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="h4" component="div" sx={{ my: 2 }}>
              {value}
            </Typography>
            
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={percentage} 
                color={trend === 'up' ? 'success' : 'error'}
              />
            </Box>
            
            <Typography 
              variant="body2" 
              color={trend === 'up' ? 'success.main' : 'error.main'}
              sx={{ mt: 1 }}
            >
              {trend === 'up' ? '↑' : '↓'} {percentage}% from last period
            </Typography>
          </CardContent>
        </MetricCard>
      </Grid>
    );
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={3}>
        {metrics.map(renderMetric)}
      </Grid>
    </Box>
  );
};

export default DetailedMetrics; 