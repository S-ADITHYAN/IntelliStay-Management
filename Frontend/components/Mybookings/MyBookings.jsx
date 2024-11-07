import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import axios from 'axios';
import './MyBookings.css';
import useAuth from '../../src/useAuth';

function MyBookings() {
  useAuth();
  const history = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBookings, setFilteredBookings] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('No user found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API}/my-bookings/${userId}`);
        if (response.status === 200) {
          setBookings(response.data);
          setFilteredBookings(response.data);
        } else {
          setError('Failed to fetch bookings');
        }
      } catch (err) {
        setError('An error occurred while fetching bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const filterBookings = () => {
      let filtered = bookings;

      if (searchQuery) {
        filtered = bookings.filter(booking => {
          const checkInDate = new Date(booking.check_in).toLocaleDateString("en-GB");
          const checkOutDate = new Date(booking.check_out).toLocaleDateString("en-GB");
          const searchLower = searchQuery.toLowerCase();

          return (
            checkInDate.includes(searchLower) ||
            checkOutDate.includes(searchLower) ||
            booking.status.toLowerCase().includes(searchLower) ||
            booking._id.toLowerCase().includes(searchLower) ||
            booking.room_id.roomtype.toLowerCase().includes(searchLower)
          );
        });
      }

      setFilteredBookings(filtered);
    };

    filterBookings();
  }, [searchQuery, bookings]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleBookingClick = (booking) => {
    // Navigate to the booking details page
    history(`/booking-details/${booking._id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <div className='MyBookingsnav'>
        <Header />
      </div>

      <div className="bookings-container">
        <h2>My Bookings</h2>
        <br />

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by check-in date, check-out date, status, etc."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {filteredBookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <ul className="bookings-list">
            {filteredBookings.slice(0, displayCount).map((booking) => (
              <li key={booking._id} onClick={() => handleBookingClick(booking)}>
                <div className={searchQuery ? 'filtered-booking' : 'booking-card'} style={{ display: 'flex', alignItems: 'center' }}>
                {booking.room_id && booking.room_id.images && booking.room_id.images.length > 0 && (
          <img
            src={`${import.meta.env.VITE_API}/uploads/${booking.room_id.images[0]}`} // Assuming the first image is the thumbnail
            alt="Room Thumbnail"
            style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px' }} // Adjust width/height as needed
          />
        )}
        <div>
                  <p><strong>BookingId:</strong> {booking._id}</p>
                  <p><strong>Room:</strong> {booking.room_id?.roomtype || 'N/A'}</p>
                  <p><strong>Check-In Date:</strong> {new Date(booking.check_in).toLocaleDateString("en-GB")}</p>
                  <p><strong>Check-Out Date:</strong> {new Date(booking.check_out).toLocaleDateString("en-GB")}</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="buttons-container">
          {displayCount < filteredBookings.length && (
            <button className="see-more-button" onClick={() => setDisplayCount(displayCount + 3)}>
              See More
            </button>
          )}

          {displayCount > 3 && (
            <button className="see-less-button" onClick={() => setDisplayCount(3)}>
              Show Less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;
