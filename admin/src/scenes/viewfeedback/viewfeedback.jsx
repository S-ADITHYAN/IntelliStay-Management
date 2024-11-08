import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { Header } from '../../components';
import Swal from 'sweetalert2';

const ViewFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get('http://localhost:3001/feedbacks'); // Adjust the endpoint as necessary
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
                        <TableCell><strong>Room Number</strong></TableCell>
                        <TableCell><strong>Room Type</strong></TableCell>
                        <TableCell><strong>Feedback</strong></TableCell>
                        <TableCell><strong>Submit Date</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {feedbacks.map((feedback) => (
                        <TableRow key={feedback._id}>
                            <TableCell>{feedback.user?.displayName || "N/A"}</TableCell>
                            <TableCell>{feedback.reservationId || "N/A"}</TableCell>
                            <TableCell>{feedback.room?.roomno || "N/A"}</TableCell>
                            <TableCell>{feedback.room?.roomtype || "N/A"}</TableCell>
                            <TableCell>{feedback.content || "N/A"}</TableCell>
                            <TableCell>{new Date(feedback.submitDate).toLocaleDateString("en-GB") || "N/A"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default ViewFeedback;