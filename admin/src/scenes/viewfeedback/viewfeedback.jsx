import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { Header } from '../../components';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ViewFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get('http://localhost:3001/feedbacks');
            console.log("API Response:", response.data); // Log the response // Adjust the endpoint as necessary
            setFeedbacks(response.data);
        } catch (err) {
            console.error("Error fetching feedbacks:", err);
            setError("An error occurred while fetching feedbacks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (error) {
        return <Typography>{error}</Typography>;
    }

    return (
        <Box m="20px">
            <Header title="User Feedbacks" subtitle="List of User Feedbacks" />
            <Table>
                <TableHead sx={{ backgroundColor: '#00A36C' }}>
                    <TableRow>
                        <TableCell><strong>User Name</strong></TableCell>
                        <TableCell><strong>Reservation ID</strong></TableCell>
                        <TableCell><strong>Hotel Rating</strong></TableCell>
                        <TableCell><strong>Room Rating</strong></TableCell>
                        <TableCell><strong>Feedback</strong></TableCell>
                        <TableCell><strong>Submit Date</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {feedbacks.map((feedback) => (
                        <TableRow key={feedback._id}>
                            <TableCell>{feedback.userId?.displayName || "N/A"}</TableCell>
                            <TableCell onClick={() => navigate(`/admindashboard/reservation-details/${feedback.reservationId?._id}`)} // Navigate on click
                            style={{ cursor: 'pointer' }} >{feedback.reservationId._id || "N/A"}</TableCell>
                            <TableCell>{feedback.hotelRating || "N/A"}</TableCell>
                            <TableCell>{feedback.roomRating || "N/A"}</TableCell>
                            <TableCell>{feedback.feedback || "N/A"}</TableCell>
                            <TableCell>{new Date(feedback.submittedDate).toLocaleDateString("en-GB") || "N/A"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default ViewFeedback;