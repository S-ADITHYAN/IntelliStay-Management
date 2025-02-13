import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import './MyTableReservation.css';
import { jwtDecode } from 'jwt-decode';
import LoadingSpinner from '../LoadingSpinner';
import Header from '../Header';
import Footer from '../footer';
import useAuth from '../../src/useAuth';  


const MyTableReservation = () => {
  useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      
      const response = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/user-reservations/${decoded._id}`);
      
      if (response.data.success) {
        setReservations(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Failed to load reservations');
      setLoading(false);
      toast.error('Failed to load reservations');
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API}/user/restaurant/table-reservations/${reservationId}/cancel`);
      
      if (response.data.success) {
        toast.success('Reservation cancelled successfully');
        fetchReservations();
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      confirmed: 'text-green-600',
      cancelled: 'text-red-600',
      completed: 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const filterReservations = (type) => {
    const now = new Date();
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.reservationDate);
      if (type === 'upcoming') {
        return reservationDate >= now && reservation.status !== 'cancelled';
      } else {
        return reservationDate < now || reservation.status === 'cancelled';
      }
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredReservations = filterReservations(activeTab);

  return (
    <>
    <div className='menunav'>
      <Header title="Guest Information" subtitle="Fill in guest details" />
    </div>
    <div className="my-reservations-container">
      <h2 className="page-title">My Table Reservations</h2>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Reservations
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Reservations
        </button>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="no-reservations">
          No {activeTab} reservations found
        </div>
      ) : (
        <div className="reservations-grid">
          {filteredReservations.map((reservation) => (
            <div key={reservation._id} className="reservation-card">
              <div className="card-header">
                <span className="reservation-id">#{reservation._id.slice(-6)}</span>
                <span className={`status ${getStatusColor(reservation.status)}`}>
                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                </span>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <i className="fas fa-calendar"></i>
                  <span>{format(new Date(reservation.reservationDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-clock"></i>
                  <span>{reservation.time}</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-users"></i>
                  <span>{reservation.numberOfGuests} Guests</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-chair"></i>
                  <span>Table {reservation.tableNumber}</span>
                </div>
                {reservation.specialRequests && (
                  <div className="special-requests">
                    <p>Special Requests:</p>
                    <p>{reservation.specialRequests}</p>
                  </div>
                )}
              </div>

              {reservation.status === 'pending' && (
                <div className="card-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => cancelReservation(reservation._id)}
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    <div className='footer'>
      <Footer/>
    </div>
    </>
  );
};

export default MyTableReservation;
