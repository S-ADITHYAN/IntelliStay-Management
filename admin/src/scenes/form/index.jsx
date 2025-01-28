import { Box, Button, TextField, useMediaQuery, MenuItem, Select, InputLabel, FormControl, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Header } from "../../components";
import { Formik } from "formik";
import * as yup from "yup";
import { useState } from "react";
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from "../../useAuth";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const initialValues = {
  displayName: "",
  password: "",
  email: "",
  phone_no: "",
  address: "",
  role: "",
  dob: "",
  salary: "", 
};

const phoneRegExp = /^\d{10}$/;
const dobRegExp = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
const displayNameRegExp = /^([A-Z][a-z]*)([. ][A-Z][a-z]*)*$/;
const salaryRegExp=/^\d{5,}$/;

const checkoutSchema = yup.object().shape({
  displayName: yup.string().matches(displayNameRegExp, "Full name should be in this 'John Doe' or 'Alice M. Smith' format").required("required"),
  role: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  phone_no: yup.string().matches(phoneRegExp, "Phone number is not valid").required("required"),
  address: yup.string().required("required"),
  dob: yup.string().matches(dobRegExp, "Date of Birth should be in yyyy-mm-dd format").required("required"),
  salary: yup.string().matches(salaryRegExp, "salary should be in number format and need atleast 5 digit salary").required("required"),
});

const Form = () => {
  useAuth();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [datePickerValue, setDatePickerValue] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [addingNewRole, setAddingNewRole] = useState(false);
  const [roles, setRoles] = useState([
    { name: 'housekeeping', salary: 25000 },
    { name: 'maintenance', salary: 30000 },
    { name: 'receptionist', salary: 20000 },
  ]);

  const roleSalaryMap = roles.reduce((map, role) => {
    map[role.name] = role.salary;
    return map;
  }, {});

  const handleAddRole = (e) => {
    if (e.key === "Enter" && newRole.trim()) {
      const roleName = newRole.trim().toLowerCase();
      if (!roles.find(role => role.name === roleName)) {
        setRoles([...roles, { name: roleName, salary: 20000 }]); // Default salary for new role
        setNewRole("");
        setAddingNewRole(false);
      }
    }
  };

  const handleDeleteRole = (roleToDelete) => {
    const updatedRoles = roles.filter(role => role.name !== roleToDelete);
    setRoles(updatedRoles);
    delete roleSalaryMap[roleToDelete]; // Remove the role from the map
  };
 
  const handleFormSubmit = (values, { resetForm }) => {
    
    console.log(values);
    Swal.fire({
      title: 'Adding staff...',
      text: 'Please wait while we process your request.',
      allowEscapeKey: false,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading(); // Show loading animation
      },
    });
    axios.post(`${import.meta.env.VITE_API}/admin/staffregister`, values)
      .then(res => {
        console.log(res);
        Swal.close();
        
        if (res.data === "exists") {
          // Show an error if the staff already exists
          Swal.fire("Error", "Staff already exists!", "error");
        } else {
          // Reset the form to its initial state
          resetForm({ values: initialValues });
          
          // Show success message
          Swal.fire("Success", "Staff added successfully. :)", "success");
        }
      })
      .catch(err => {
        console.error("Error during submission:", err);
        
        // Show an error message if something goes wrong
        Swal.fire("Error", "Something went wrong. Please try again later.", "error");
      });
  };
  
  const today = new Date();
  const eighteenYearsAgo = new Date(today.setFullYear(today.getFullYear() - 18));
  const maxDate = eighteenYearsAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileType = file.name.split('.').pop();
        const reader = new FileReader();

        reader.onload = async (event) => {
            const data = event.target.result;
            let parsedData;

            if (fileType === 'csv') {
                parsedData = Papa.parse(data, { header: true }).data;
            } else if (fileType === 'xlsx') {
                const workbook = XLSX.read(data, { type: 'binary' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                parsedData = parsedData.slice(1); // Skip header row
            }

            // Validate parsed data
            // Map and format parsed data
            const formattedData = parsedData.map(row => {
              const [displayName, dob, email, role, phone_no, salary, address] = row;

              // Handle date parsing for dob (Excel serial number conversion)
              let parsedDob;
              if (typeof dob === 'number') {
                  parsedDob = XLSX.SSF.format("yyyy-mm-dd", dob); // Convert Excel serial number to date
              } else {
                  parsedDob = dob; // If already a string, use as is
              }

              return {
                  displayName: displayName,
                  dob: parsedDob,
                  email: email,
                  role: role,
                  phone_no: phone_no,
                  salary: salary,
                  address: address
              };
          });

            // Validate and upload rooms
            await validateAndUploadStaffs(formattedData);
        };

        reader.readAsBinaryString(file);
    }
};

// Validation function

// const validateBulkData = (data) => {
//     const errors = [];
//     data.forEach((row, index) => {
//         if ( roomSchema.validate(row)) {
//             errors.push({ row: index + 2, error: "Invalid room number" });
//         }
//         // Add more validation rules as needed
//     });
//     return errors;
// };
const validateAndUploadStaffs = async (staffs) => {
    const validatedStaffs = [];
    const errors = [];

    for (let i = 0; i < staffs.length; i++) {
        const staff = staffs[i];
       
       

        try {
            // Validate the room data using yup schema
            await checkoutSchema.validate(staff, { abortEarly: false });
            validatedStaffs.push(staff);
        } catch (validationError) {
            // Collect validation errors for the current row
            if (validationError.inner) {
                validationError.inner.forEach(err => {
                    errors.push(`Row ${i + 1}: ${err.message}`);
                });
            } else {
                errors.push(`Row ${i + 1}: ${validationError.message}`);
            }
        }
    }

    if (errors.length > 0) {
        // Show validation errors to the user
        Swal.fire({
            title: "Validation Errors",
            html: errors.join("<br>"),
            icon: "error",
        });
        // Download errors in CSV and XLSX formats
        downloadCSV(errors.map((error, index) => ({ row: index + 1, error })));
        downloadXLSX(errors.map((error, index) => ({ row: index + 1, error })));
    } else {
        // No validation errors, proceed to bulk upload
        try {
          Swal.fire({
            title: 'Adding staffs...',
            text: 'Please wait while we process your request.',
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading(); // Show loading animation
            },
          });
            await axios.post(`${import.meta.env.VITE_API}/admin/uploadBulkStaffData`, validatedStaffs);
            Swal.close();
            Swal.fire("Success", "Bulk staff details uploaded successfully!", "success");
        } catch (error) {
            Swal.fire("Error", "Failed to upload bulk data. Please try again.", "error");
        }
    }
};


// Download functions
const downloadCSV = (data) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "validation_errors.csv");
};

const downloadXLSX = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([xlsxData], { type: "application/octet-stream" });
    saveAs(blob, "validation_errors.xlsx");
};

const downloadCSVTemplate = () => {
    const data = [
        {
          displayName:  "Example: SampleName",
                dob: "Example: 19997-08-18",
                email:  "Example: sample@gmail.com",
                role:  "Example: Housekeepingstaff",
                phone_no:  "Example: 9988776655",
                salary:  "Example: 10000",
                address:  "Example: asadnsjksdsd(h),ssshdshd p.o,hsxhgasg,iidhbhs",
            
        },
    ];
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "staff_template.csv");
};

const downloadXLSXTemplate = () => {
    const data = [
        { displayName:  "Example: SampleName",
          dob: "Example: 19997-08-18",
          email:  "Example: sample@gmail.com",
          role:  "Example: Housekeepingstaff",
          phone_no:  "Example: 9988776655",
          salary:  "Example: 10000",
          address:  "Example: asadnsjksdsd(h),ssshdshd p.o,hsxhgasg,iidhbhs", },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([xlsxData], { type: "application/octet-stream" });
    saveAs(blob, "staff_template.xlsx");
};



  return (
    <Box m="20px">
      <Header title="ADD STAFF" subtitle="Add a New Staff" />
      
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          setFieldValue,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": {
                  gridColumn: isNonMobile ? undefined : "span 4",
                },
              }}
            >
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Full Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.displayName}
                name="displayName"
                error={touched.displayName && errors.displayName}
                helperText={touched.displayName && errors.displayName}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="date"
                label="Date of Birth"
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue("dob", e.target.value);
                  setDatePickerValue(e.target.value);
                }}
                value={datePickerValue || values.dob} // Show the selected date if available
                name="dob"
                error={touched.dob && errors.dob}
                helperText={touched.dob && errors.dob}
                InputProps={{
                  inputProps: {
                    max: maxDate, // Set maximum date to 18 years ago
                  },
                }}
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="email"
                label="Email"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                name="email"
                error={touched.email && errors.email}
                helperText={touched.email && errors.email}
                sx={{ gridColumn: "span 2" }}
              />

              <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 2" }}>
                
                <Select
                  name="role"
                  value={values.role}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setFieldValue("role", selectedRole);
                    setFieldValue("salary", roleSalaryMap[selectedRole] || "");
                  }}
                  error={touched.role && errors.role}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em>Select Role</em>;
                    }
                    return selected.charAt(0).toUpperCase() + selected.slice(1);
                  }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.name} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      <IconButton
                        onClick={() => handleDeleteRole(role.name)}
                        sx={{ ml: 2 }}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </MenuItem>
                  ))}
                  {addingNewRole ? (
                    <TextField
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyDown={handleAddRole}
                      placeholder="Type and press enter..."
                      variant="standard"
                      fullWidth
                      sx={{ margin: "8px 16px" }}
                    />
                  ) : (
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents the menu from closing
                        setAddingNewRole(true);
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{ backgroundColor: "#5995fd" }}
                      >
                        Add New Role
                      </Button>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Contact Number"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.phone_no}
                name="phone_no"
                error={touched.phone_no && errors.phone_no}
                helperText={touched.phone_no && errors.phone_no}
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Salary"
                onBlur={handleBlur}
                value={values.salary}
                name="salary"
                error={touched.salary && errors.salary}
                helperText={touched.salary && errors.salary}
                InputProps={{
                  readOnly: true, // Makes the salary field non-editable
                }}
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Address"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.address}
                name="address"
                error={touched.address && errors.address}
                helperText={touched.address && errors.address}
                sx={{ gridColumn: "span 4" }}
              />
            </Box>

            <Box display="flex" alignItems="center" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained" >
                Add New Staff
              </Button>
              
            </Box>
            <Box>
            <br></br><br></br>
                            <input
                                accept=".csv, .xlsx"
                                id="bulk-upload"
                                type="file"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="bulk-upload">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    component="span"
                                    
                                >
                                    Upload Bulk Data
                                </Button>
                            </label><br></br><br></br>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={downloadCSVTemplate}
                                
                            >
                                Download CSV Template
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={downloadXLSXTemplate}
                                sx={{ ml: 2 }}
                            >
                                Download XLSX Template
                            </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default Form;
