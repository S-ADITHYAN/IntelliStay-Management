import React, { useState, useEffect } from 'react';
import { FaUsers, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaChair, FaUmbrella, FaBuilding } from 'react-icons/fa';
import { GiRoundTable, GiWoodenChair } from 'react-icons/gi';
import { MdTableBar, MdTableRestaurant } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './TableReservation.css';
import { jwtDecode } from 'jwt-decode';
import Header from '../../components/Header';
import Footer from '../../components/footer';
import { toast } from 'react-hot-toast';

const TableReservation = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmedReservations, setConfirmedReservations] = useState([]);

  // Get available time slots
  const getTimeSlots = () => {
    const slots = [];
    const currentDate = new Date();
    const selectedDateStr = selectedDate.toDateString();
    const isToday = currentDate.toDateString() === selectedDateStr;
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    for (let i = 11; i <= 22; i++) { // 11 AM to 10 PM
      // For current date, only show future times
      if (isToday) {
        // Skip past hours
        if (i < currentHour) continue;
        
        // For current hour, check minutes
        if (i === currentHour) {
          // Only show :30 slot if current time is before :30
          if (currentMinutes < 30) {
            slots.push(`${i}:30`);
          }
        } else {
          // For future hours, show both slots
          slots.push(`${i}:00`);
          slots.push(`${i}:30`);
        }
      } else {
        // For future dates, show all slots
        slots.push(`${i}:00`);
        slots.push(`${i}:30`);
      }
    }
    return slots;
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/tables`);
      
      if (response.data && response.data.data) {
        setTables(response.data.data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError(error.message || 'Failed to load tables');
      showErrorAlert('Failed to load tables');
      setTables([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch confirmed reservations for the selected date
  const fetchConfirmedReservations = async (date, time) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/confirmed-reservations`, {
        params: {
          date: date.toISOString(),
          time: time
        }
      });
      
      if (response.data.success) {
        setConfirmedReservations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching confirmed reservations:', error);
      toast.error('Error checking table availability');
    }
  };

  // Update confirmed reservations when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchConfirmedReservations(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    fetchTables();
  }, []);

  const getLocationIcon = (location) => {
    switch (location) {
      case 'Indoor':
        return <FaBuilding className="location-icon indoor" />;
      case 'Outdoor':
        return <FaUmbrella className="location-icon outdoor" />;
      case 'Balcony':
        return <FaChair className="location-icon balcony" />;
      default:
        return <FaMapMarkerAlt className="location-icon" />;
    }
  };

  const handleReservation = async (tableId) => {
    try {
      const selectedTable = tables.find(t => t._id === tableId);
      
      const result = await Swal.fire({
        title: 'Confirm Reservation',
        html: `
          <div class="reservation-confirmation">
            <p><strong>Table:</strong> ${selectedTable.tableNumber}</p>
            <p><strong>Date:</strong> ${selectedDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${selectedTime}</p>
            <p><strong>Guests:</strong> ${guests}</p>
            <p><strong>Location:</strong> ${selectedTable.location}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirm Reservation',
        cancelButtonText: 'Cancel',
        customClass: {
          popup: 'reservation-popup'
        }
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        console.log(guests)
        const response = await axios.post(`${import.meta.env.VITE_API}/user/restaurant/table-reservations`, {
          userId: decoded._id,
          table_id: selectedTable._id,
          tableNumber: selectedTable.tableNumber,
          reservationDate: selectedDate,
          numberOfGuests: guests,
          specialRequests,
          time: selectedTime
        });

        if (response.data.success) {
          showSuccessAlert();
        }
      }
    } catch (error) {
      console.error('Reservation error:', error);
      showErrorAlert(error.response?.data?.message || 'Failed to make reservation');
    }
  };

  const showSuccessAlert = () => {
    Swal.fire({
      title: 'Reservation Confirmed!',
      html: `
        <div class="success-animation">
          <div class="checkmark">
            <div class="check-icon"></div>
          </div>
        </div>
        <p>Your table has been successfully reserved.</p>
      `,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      title: 'Oops...',
      text: message,
      icon: 'error',
      customClass: {
        popup: 'error-popup'
      }
    });
  };

  // Filter out tables that are already reserved
  const getFilteredTables = () => {
    if (!Array.isArray(tables)) return [];
    
    // First, get all available tables (not reserved)
    const availableTables = tables.filter(table => {
        if (!table) return false;
        
        const isReserved = confirmedReservations.some(
            reservation => reservation.tableNumber === table.tableNumber
        );
        
        const locationMatch = selectedLocation === 'all' || table.location === selectedLocation;
        
        return !isReserved && locationMatch && table.isAvailable;
    });

    // Find exact capacity matches
    const exactMatches = availableTables.filter(table => table.capacity === guests);
    
    if (exactMatches.length > 0) {
        // If we have exact matches, return only those
        return exactMatches;
    }
    
    // If no exact matches, find the tables with the smallest suitable capacity
    const suitableTables = availableTables.filter(table => table.capacity > guests);
    if (suitableTables.length > 0) {
        // Find the minimum capacity that can accommodate the guests
        const minCapacity = Math.min(...suitableTables.map(table => table.capacity));
        // Return only tables with that minimum capacity
        return suitableTables
            .filter(table => table.capacity === minCapacity)
            .sort((a, b) => a.capacity - b.capacity);
    }
    
    // If no suitable tables found, return empty array
    return [];
  };

  // Add a function to show capacity warning
  const showCapacityWarning = (tableCapacity) => {
    if (tableCapacity > guests) {
        return (
            <div className="capacity-warning">
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                    No {guests}-seat tables available. This {tableCapacity}-seat table is the next best available option.
                </small>
            </div>
        );
    }
    return null;
  };

  const getTableIcon = (capacity) => {
    // Return different table layouts based on capacity
    const renderChairs = (count) => {
      return Array(count).fill(0).map((_, index) => (
        <GiWoodenChair 
          key={index} 
          className={`chair-icon chair-${index + 1}`}
        />
      ));
    };

    return (
      <div className="table-layout">
        {capacity <= 4 ? (
          <>
            <div className="small-table">
              <GiRoundTable className="table-icon" />
            </div>
            <div className="chairs-container">
              {renderChairs(capacity)}
            </div>
          </>
        ) : (
          <>
            <div className="large-table">
              <MdTableRestaurant className="table-icon" />
            </div>
            <div className="chairs-container large">
              {renderChairs(capacity)}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
    <div className='menunav'>
      <Header title="Guest Information" subtitle="Fill in guest details" />
    </div>
    <div className="table-reservation-container">
      <h2 className="section-title">
        <MdTableBar /> Table Reservation
      </h2>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchTables}>Try Again</button>
        </div>
      )}

      <div className="reservation-form">
        <div className="form-group date-group">
          <FaCalendarAlt className="form-icon" />
          <label>Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            minDate={new Date()}
            className="date-picker"
            dateFormat="dd/MM/yyyy"
            popperPlacement="top-start"
            popperModifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 5],
                },
              },
              {
                name: "preventOverflow",
                options: {
                  boundary: "viewport",
                  altAxis: true,
                  padding: 8,
                },
              },
            ]}
            dayClassName={date => {
              // Add custom classes for different date states
              return date < new Date().setHours(0, 0, 0, 0)
                ? 'react-datepicker__day--past'
                : undefined;
            }}
            renderDayContents={(day, date) => {
              return <span>{day}</span>;
            }}
            showPopperArrow={true}
            calendarStartDay={1} 
          />
        </div>

        <div className="form-group time-group">
          <FaClock className="form-icon" />
          <label>Select Time</label>
          <select 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="time-select"
          >
            <option value="">Choose time</option>
            {getTimeSlots().map(slot => (
              <option 
                key={slot} 
                value={slot}
              >
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group guests-group">
          <FaUsers className="form-icon" />
          <label>Number of Guests</label>
          <input
            type="number"
            min="1"
            max="10"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="guests-input"
          />
        </div>

        <div className="form-group location-group">
          <FaMapMarkerAlt className="form-icon" />
          <label>Preferred Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="location-select"
          >
            <option value="all">All Locations</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Balcony">Balcony</option>
          </select>
        </div>
      </div>

      <div className="tables-grid">
        {getFilteredTables().map(table => (
          <div key={table._id} className="table-card">
            <div className="table-header">
              <h3>Table {table.tableNumber}</h3>
              {getLocationIcon(table.location)}
            </div>
            
            <div className="table-visualization">
              {getTableIcon(table.capacity)}
            </div>
            
            <div className="table-details">
              <p>
                <FaUsers />
                Capacity: {table.capacity} persons
                {showCapacityWarning(table.capacity)}
              </p>
              <p>
                <FaMapMarkerAlt />
                Location: {table.location}
              </p>
            </div>

            <textarea
              placeholder="Special requests or notes..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="special-requests"
            />

            <button
              className="reserve-btn"
              onClick={() => handleReservation(table._id)}
              disabled={!selectedDate || !selectedTime}
            >
              Reserve Table
            </button>
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available tables...</p>
        </div>
      )}

      {!loading && !error && getFilteredTables().length === 0 && (
        <div className="no-tables">
          <p>No tables available for {guests} guests</p>
          <small>
            Try adjusting the number of guests or selecting a different time/date
          </small>
        </div>
      )}
    </div>
    <div className='footer'>
      <Footer/>
    </div>
    </>
  );
};

export default TableReservation;
