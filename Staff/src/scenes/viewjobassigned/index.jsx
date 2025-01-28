import { Box, useTheme,Button,Typography } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { mockDataContacts } from "../../data/mockData";
import { tokens } from "../../theme";
import { useEffect,useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";


const Viewassignedjobs = () => {
  useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  
    const [jobdetails, setjobdetails] = useState([]);
  
    const asjobdetails = () => {
      axios.post(`${import.meta.env.VITE_API}/staff/asjobdetails`)
        .then(res => {
          console.log(res.data);
          setjobdetails(res.data);
        })
        .catch(err => console.log(err));
    };

    const handleCancellation = (id) => {
        // Handle maintenance action
        axios.post(`${import.meta.env.VITE_API}/staff/handleCancellation`,{ id })
          .then(res => {
           
            Swal.fire(res.data);
            asjobdetails();
          })
          .catch(err => console.log(err));
       
      };

    useEffect(() => {
      asjobdetails();
      }, []);

  const columns = [
    { field: "_id", headerName: "Job_ID", flex: 0.5 },
    { field: "room_id", headerName: "Room ID" },
    {
      field: "staff_id",
      headerName: "Staff_ID",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "task_description",
      headerName: "Task_Description",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "task_date",
      headerName: "Task_Date",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
    
    // {
    //   field: "role",
    //   headerName: "Staff Role",
    //   flex: 1,
    //   renderCell: ({ row: { role } }) => {
    //     return (
    //       <Box
    //         width="120px"
    //         p={1}
    //         display="flex"
    //         alignItems="center"
    //         justifyContent="center"
    //         gap={1}
    //         bgcolor={
    //           role === "housekeeping"
    //             ? colors.greenAccent[600]
    //             : colors.greenAccent[700]
    //         }
    //         borderRadius={1}
    //       >
    //         <Typography textTransform="capitalize">{role}</Typography>
    //       </Box>
    //     );
    //   },
    // },
    // {
    //     field: "actions",
    //   headerName: "Actions",
    //   flex: 1,
    //   renderCell: (params) => (
    //     <Box display="flex" gap="10px">
    //       <Button
    //         variant="contained"
    //         color="primary"
    //         size="small"
    //         onClick={() => handleEdit(params.row._id)}
    //       >
    //         Edit
    //       </Button>
    //       <Button
    //         variant="contained"
            
    //         size="small"
    //         onClick={() =>
    //             params.row.status === "reserved" ? handleCancellation(params.row._id) : null
    //           }
    //           style={{
    //             backgroundColor: params.row.status === "reserved" ? "red" : "#ff6666",
    //             cursor: params.row.status === "reserved" ? "pointer" : "not-allowed",
    //           }}
    //           disabled={params.row.status !== "reserved"}
    //         >
    //     {params.row.status === "cancelled" ? "Cancelled" : "Cancel"}
    //       </Button>
    //     </Box>
    //   ),
    //   },

  ];
  return (
    <Box m="20px">
      <Header
        title="Staff Details"
        subtitle="List of Staff's and their Details "
      />
      <Box
        mt="40px"
        height="75vh"
        maxWidth="100%"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            border: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[500],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[500],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-iconSeparator": {
            color: colors.primary[100],
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.gray[300]} !important`,
          },
        }}
      >
        <DataGrid
          rows={jobdetails}
          columns={columns}
          getRowId={(row) => row._id}
          components={{ Toolbar: GridToolbar }}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          checkboxSelection
        />
      </Box>
    </Box>
  );
};

export default Viewassignedjobs;
