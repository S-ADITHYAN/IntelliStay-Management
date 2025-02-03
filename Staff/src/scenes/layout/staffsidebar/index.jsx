/* eslint-disable react/prop-types */
import { Avatar, Box, IconButton, Typography, useTheme } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { tokens } from "../../../theme";
import { Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import {
  DashboardOutlined,
  PersonOutlined,
  ContactsOutlined,
  PeopleAltOutlined,
  MenuOutlined,
} from "@mui/icons-material";
import avatar from "../../../assets/images/avatar.png";
import logo from "../../../assets/images/logo.png";
import Logo from "../../../../public/logo1.png";
import Item from "./Item";
import { ToggledContext } from "../../../App";
import {jwtDecode} from "jwt-decode";
import axios from "axios";

const StaffSideBar = () => {
  const [userData, setUserData] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const { toggled, setToggled } = useContext(ToggledContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken); // Store the decoded data in the state
        const fetchStaffData = async () => {
          try {
            const response = await axios.get(`${import.meta.env.VITE_API}/staff/staffprof/${decodedToken._id}`);
            setUserData((prev) => ({ ...prev, ...response.data }));
            
          } catch (error) {
            console.error("Error fetching staff data:", error);
          }
        };

        fetchStaffData();
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []); // Runs once after the component is mounted

  console.log("userData",userData);

  return (
    <Sidebar
      backgroundColor={colors.primary[400]}
      rootStyles={{
        border: 0,
        height: "100%",
      }}
      collapsed={collapsed}
      onBackdropClick={() => setToggled(false)}
      toggled={toggled}
      breakPoint="md"
    >
      <Menu
        menuItemStyles={{
          button: { ":hover": { background: "transparent" } },
        }}
      >
        <MenuItem
          rootStyles={{
            margin: "10px 0 20px 0",
            color: colors.gray[100],
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {!collapsed && (
              <Box
                display="flex"
                alignItems="center"
                gap="12px"
                sx={{ transition: ".3s ease" }}
              >
                <img
                  style={{ width: "30px", height: "30px", borderRadius: "8px" }}
                  src={Logo}
                  alt="IntelliStay"
                />
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  textTransform="capitalize"
                  color={colors.greenAccent[500]}
                >
                  IntelliStay
                </Typography>
              </Box>
            )}
            <IconButton onClick={() => setCollapsed(!collapsed)}>
              <MenuOutlined />
            </IconButton>
          </Box>
        </MenuItem>
      </Menu>

      {!collapsed && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            mb: "25px",
          }}
        >
          <Avatar
            alt={ (userData)? userData.displayName:"avatar"}
            src={(userData)? userData.image : avatar}
            sx={{ width: "100px", height: "100px" }}
          />
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h3" fontWeight="bold" color={colors.gray[100]}>
              {userData ? userData.displayName : "Staff"}
            </Typography>
            <Typography
              variant="h6"
              fontWeight="500"
              color={colors.greenAccent[500]}
            >
              {userData ? userData.role : "Dashboard"}
            </Typography>
          </Box>
        </Box>
      )}

      <Box mb={5} pl={collapsed ? undefined : "5%"}>
        <Menu
          menuItemStyles={{
            button: {
              ":hover": {
                color: "#868dfb",
                background: "transparent",
                transition: ".4s ease",
              },
            },
          }}
        >
          {/* Common items for all staff */}
          <Item
            title="Dashboard"
            path="/dashboard"
            colors={colors}
            icon={<DashboardOutlined />}
          />
          <Item
            title="My Profile"
            path="/dashboard/myprofile"
            colors={colors}
            icon={<PeopleAltOutlined />}
          />
          <Item
            title="Apply Leave"
            path="/dashboard/applyleave"
            colors={colors}
            icon={<PeopleAltOutlined />}
          />
          <Item
            title="View Leave Status"
            path="/dashboard/viewleavestatus"
            colors={colors}
            icon={<PeopleAltOutlined />}
          />
          {/* <Item
                title="view assigned jobs"
                path="/dashboard/viewjobs"
                colors={colors}
                icon={<PersonOutlined />}
              /> */}

          {/* Role-based items */}
          {userData?.role === "receptionist" && (
            <>
              <Item
                title="Check In Handle"
                path="/dashboard/checkin"
                colors={colors}
                icon={<PersonOutlined />}
              />
              <Item
                title="Check Out Handle"
                path="/dashboard/checkout"
                colors={colors}
                icon={<PersonOutlined />}
              />
              <Item
                title="Reserve Room"
                path="/dashboard/reserveroom"
                colors={colors}
                icon={<ContactsOutlined />}
              />
              <Item
                title="View all Reservations"
                path="/dashboard/viewallreservations"
                colors={colors}
                icon={<ContactsOutlined />}
              />
            </>
          )}
          {userData?.role === "housekeeping" && (
            <>
              <Item
                title="view assigned jobs"
                path="/dashboard/viewjobs"
                colors={colors}
                icon={<PersonOutlined />}
              />
            
              
            </>
          )}

          {userData?.role === "restaurantstaff" && (
            <>
              <Item
                title="Restaurant"
                path="/dashboard/restaurant"
                colors={colors}
                icon={<PersonOutlined />}
              />
            </>
          )}
          {/* Add more role-based conditions as needed */}
        </Menu>
      </Box>
    </Sidebar>
  );
};

export default StaffSideBar;
