import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isValid, parseISO } from 'date-fns';
import { 
  FaCalendar, 
  FaClock, 
  FaUsers, 
  FaCheck, 
  FaTimes,
  FaSearch,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowLeft
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './ReservationManagement.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { tokens } from "../../theme";

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // day, week, month
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  useEffect(() => {
    fetchReservations();
  }, [selectedDate, viewMode]);

  const fetchReservations = async () => {
    try {
      const startDate = new Date(selectedDate);
      let endDate = new Date(selectedDate);
      
      if (viewMode === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (viewMode === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }

      const response = await axios.get(`${import.meta.env.VITE_API}/staff/restaurant/reservations`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      setReservations(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API}/staff/restaurant/reservations/status/${reservationId}`, {
        status: newStatus
      });
      fetchReservations();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  const handleContactCustomer = (type, contact) => {
    if (type === 'phone') {
      window.location.href = `tel:${contact}`;
    } else if (type === 'email') {
      window.location.href = `mailto:${contact}`;
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let i = 11; i <= 22; i++) { // 11 AM to 10 PM
      slots.push(`${i}:00`);
      slots.push(`${i}:30`);
    }
    return slots;
  };

  const filterReservations = () => {
    const reservationsArray = Array.isArray(reservations) ? reservations : [];
    
    return reservationsArray.filter(reservation => {
      const customerName = reservation?.user?.displayName || '';
      const reservationId = reservation?._id || '';
      const status = reservation?.status || '';
      const searchTermLower = searchTerm.toLowerCase();

      const matchesSearch = 
        customerName.toLowerCase().includes(searchTermLower) ||
        reservationId.includes(searchTermLower);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getReservationsForTimeSlot = (timeSlot) => {
    return filterReservations().filter(reservation => {
      try {
        // Check if reservation and time exist
        if (!reservation?.time) {
          console.warn('Missing time for reservation:', reservation);
          return false;
        }

        // Format the reservation time to match timeSlot format
        const formattedTime = formatReservationTime(reservation.time);
        
        return formattedTime === timeSlot;
      } catch (error) {
        console.error('Error processing reservation time:', error);
        return false;
      }
    });
  };

  // Helper function to format time consistently
  const formatReservationTime = (time) => {
    try {
      // Handle different time formats
      if (time.includes('AM') || time.includes('PM')) {
        // Convert 12-hour format to 24-hour
        const [timeStr, period] = time.split(' ');
        let [hours, minutes] = timeStr.split(':');
        hours = parseInt(hours);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours}:${minutes}`;
      } else {
        // Already in 24-hour format
        return time;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="reservation-management">
      <div className="page-header">
        <button 
          className="back-btn" 
          onClick={handleBack}
          style={{ 
            color: colors?.primary?.[100] || '#000000',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px',
            fontSize: '16px'
          }}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="reservation-header">
        <h2>Reservation Management</h2>
        <div className="reservation-controls">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <div className="view-toggles">
            <button 
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="reservation-layout">
        <div className="calendar-sidebar">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={({ date }) => {
              const reservationsForDate = reservations.filter(
                res => new Date(res.reservationDate).toDateString() === date.toDateString()
              );
              return reservationsForDate.length > 0 && (
                <div className="reservation-dot">
                  {reservationsForDate.length}
                </div>
              );
            }}
          />
        </div>

        <div className="reservation-timeline">
          <h3>{selectedDate.toLocaleDateString()}</h3>
          
          <div className="timeline-slots">
            {getTimeSlots().map(timeSlot => (
              <div key={timeSlot} className="time-slot">
                <div className="time-label">{timeSlot}</div>
                <div className="slot-reservations">
                  {getReservationsForTimeSlot(timeSlot).map(reservation => (
                    <div 
                      key={reservation._id}
                      className={`reservation-card ${reservation.status}`}
                      onClick={() => setSelectedReservation(reservation)}
                    >
                      <div className="reservation-info">
                        <h4>{reservation.customerName}</h4>
                        <p>Table {reservation.tableNumber} • {reservation.numberOfGuests} guests</p>
                        <span className={`status-badge ${reservation.status}`}>
                          {reservation.status}
                        </span>
                      </div>

                      <div className="reservation-actions">
                        {reservation.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateReservationStatus(reservation._id, 'confirmed')}
                              className="confirm-btn"
                            >
                              <FaCheck /> Confirm
                            </button>
                            <button 
                              onClick={() => updateReservationStatus(reservation._id, 'cancelled')}
                              className="cancel-btn"
                            >
                              <FaTimes /> Cancel
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => handleContactCustomer('phone', reservation.phoneNumber)}
                          className="contact-btn"
                        >
                          <FaPhoneAlt />
                        </button>
                        <button 
                          onClick={() => handleContactCustomer('email', reservation.email)}
                          className="contact-btn"
                        >
                          <FaEnvelope />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedReservation && (
        <div className="modal-overlay" onClick={() => setSelectedReservation(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reservation Details</h3>
            <div className="reservation-details">
              <div className="reservation-header">
                <p className="reservation-id">
                  <strong>Reservation ID:</strong> #{selectedReservation._id}
                </p>
                <span className={`status-badge ${selectedReservation.status}`}>
                  {selectedReservation.status}
                </span>
              </div>
              
              <div className="customer-info">
                <p>
                  <i className="fas fa-user"></i>
                  <strong>Customer:</strong> {selectedReservation.user?.displayName || 'N/A'}
                </p>
              </div>

              <div className="reservation-info">
                <p><FaUsers /> {selectedReservation.numberOfGuests} guests</p>
                <p><FaCalendar /> {new Date(selectedReservation.reservationDate).toLocaleDateString()}</p>
                <p><FaClock /> {new Date(selectedReservation.reservationDate).toLocaleTimeString()}</p>
                <p><i className="fas fa-chair"></i> Table: {selectedReservation.tableNumber}</p>
                <p className="special-requests">
                  <i className="fas fa-comment-alt"></i>
                  <strong>Special Requests:</strong> {selectedReservation.specialRequests || 'None'}
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedReservation(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement; 