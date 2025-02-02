/* eslint-disable react/prop-types */
import { ResponsiveBar } from "@nivo/bar";
import { useTheme, Box } from "@mui/material";
import { tokens } from "../theme";

const BarChart = ({ data = [] }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {
    gray: { 100: '#e0e0e0' },
    primary: { 300: '#90caf9' }
  };

  // Ensure we have valid data with proper structure
  const safeData = Array.isArray(data) && data.length > 0 
    ? data.map(item => ({
        ...item,
        value: Number(item.value) || 0
      }))
    : [{ category: "No Data", value: 0 }];

  if (!safeData[0]?.category) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        No data available
      </Box>
    );
  }

  return (
    <ResponsiveBar
      data={safeData}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.gray[100],
            },
          },
          legend: {
            text: {
              fill: colors.gray[100],
            },
          },
          ticks: {
            line: {
                stroke: colors.gray[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.gray[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.gray[100],
          },
        },
      }}
      keys={["value"]}
      indexBy="category"
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "nivo" }}
      borderColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
      enableLabel={true}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      role="application"
      ariaLabel="Bar Chart"
    />
  );
};

export default BarChart;
