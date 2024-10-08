import { Box, useTheme } from "@mui/material";
import { Header, GeographyChart } from "../../components";
import { tokens } from "../../theme";
import useAuth from "../../useAuth";

const Geography = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box m="20px">
      <Header title="Geography" subtitle="Simple Geography Chart" />

      <Box
        height="75vh"
        border={`1px solid ${colors.gray[100]}`}
        borderRadius="4px"
      >
        {/* <GeographyChart /> */}
      </Box>
    </Box>
  );
};

export default Geography;
