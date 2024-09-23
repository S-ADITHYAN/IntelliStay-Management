import { Box } from "@mui/material";
import { Header, LineChart } from "../../components";
import useAuth from "../../useAuth";

const Line = () => {
  useAuth();
  return (
    <Box m="20px">
      <Header title="Line Chart" subtitle="Simple Line Chart" />
      <Box height="75vh">
        <LineChart />
      </Box>
    </Box>
  );
};

export default Line;
