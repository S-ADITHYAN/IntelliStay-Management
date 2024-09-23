import { Box } from "@mui/material";
import { Header, BarChart } from "../../components";
import useAuth from "../../useAuth";

const Bar = () => {
  useAuth();
  return (
    <Box m="20px">
      <Header title="Bar Chart" subtitle="Simple Bar Chart" />
      <Box height="75vh">
        <BarChart />
      </Box>
    </Box>
  );
};

export default Bar;
