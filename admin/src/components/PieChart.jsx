import { ResponsivePie } from "@nivo/pie";
import { useTheme, Box } from "@mui/material";
import { tokens } from "../theme";

const PieChart = ({ data = [] }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {
    gray: { 100: '#e0e0e0' },
    primary: { 300: '#90caf9' }
  };

  // Ensure we have valid data with proper structure
  const safeData = Array.isArray(data) && data.length > 0 
    ? data.map(item => ({
        id: item.id || item.label || 'Unknown',
        label: item.label || item.id || 'Unknown',
        value: Number(item.value) || 0
      }))
    : [{ id: "no-data", label: "No Data", value: 1 }];

  if (!safeData[0]?.value) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        No data available
      </Box>
    );
  }

  return (
    <ResponsivePie
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
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      enableArcLinkLabels={true}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={colors.gray[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      role="application"
      ariaLabel="Pie Chart"
    />
  );
};

export default PieChart;
