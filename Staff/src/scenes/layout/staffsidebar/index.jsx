/* eslint-disable react/prop-types */
import { Avatar, Box, IconButton, Typography, useTheme } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { tokens } from "../../../theme";
import { Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import {
  BarChartOutlined,
  CalendarTodayOutlined,
  ContactsOutlined,
  DashboardOutlined,
  DonutLargeOutlined,
  HelpOutlineOutlined,
  MapOutlined,
  MenuOutlined,
  PeopleAltOutlined,
  PersonOutlined,
  ReceiptOutlined,
  TimelineOutlined,
  WavesOutlined,
} from "@mui/icons-material";
import avatar from "../../../assets/images/avatar.png";
import logo from "../../../assets/images/logo.png";
import Item from "./Item";
import { ToggledContext } from "../../../App";
import { jwtDecode } from "jwt-decode";
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
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []); // Runs once after the component is mounted

  console.log(userData);

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
                  src={logo}
                  alt="Argon"
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
            alt="avatar"
            src={`http://localhost:3001/profilepicture/${
              userData?.image || avatar
            }`}
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
          {/* Always displayed items */}
          <Item
            title="Dashboard"
            path="/dashboard"
            colors={colors}
            icon={<DashboardOutlined />}
          />

          {/* Role-based items */}
          {userData?.role === "frontdesk" && (
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
            </>
          )}

          {/* Other staff menu items */}
          {userData?.role !== "frontdesk" && (
            <>
              <Item
                title="My Profile"
                path="/dashboard/myprofile"
                colors={colors}
                icon={<PeopleAltOutlined />}
              />
              <Item
                title="View Jobs"
                path="/dashboard/viewjobs"
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
            </>
          )}
        </Menu>
      </Box>
    </Sidebar>
  );
};

export default StaffSideBar;
