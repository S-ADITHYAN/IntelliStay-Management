import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './checkin.css';

// Date formatting function
const formatDate = (date) => {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

function Checkin({ searchdata }) {  // Accept the searchdata prop
  const navigate = useNavigate();
  const [guestPopupVisible, setGuestPopupVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    checkInDate: null,
    checkOutDate: null,
    adults: 1,
    children: 0,
  });
  const [minCheckOutDate, setMinCheckOutDate] = useState('');

  useEffect(() => {
    if (searchdata && Object.keys(searchdata).length > 0) {
      console.log("Received searchdata:", searchdata);
      setBookingDetails({
        ...searchdata,
        checkInDate: searchdata.checkInDate ? new Date(searchdata.checkInDate) : null,
        checkOutDate: searchdata.checkOutDate ? new Date(searchdata.checkOutDate) : null
      });
    }
  }, [searchdata]);

  const today = new Date().toISOString().split('T')[0];

  const handleCheckInChange = (date) => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      checkInDate: date,
      checkOutDate: prevDetails.checkOutDate && prevDetails.checkOutDate <= date ? null : prevDetails.checkOutDate
    }));

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const formattedNextDay = nextDay.toISOString().split('T')[0];
    setMinCheckOutDate(formattedNextDay);

    // Automatically set the check-out date to the next day
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      checkInDate: date,
      checkOutDate: nextDay
    }));
  };

  const handleCheckOutChange = (date) => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      checkOutDate: date
    }));
  };

  const toggleGuestPopup = () => {
    setGuestPopupVisible(!guestPopupVisible);
  };

  const handleAdultChange = (increment) => {
    setBookingDetails((prevDetails) => ({
      ...prevDetails,
      adults: prevDetails.adults + increment,
    }));
  };

  const handleChildrenChange = (increment) => {
    setBookingDetails((prevDetails) => ({
      ...prevDetails,
      children: prevDetails.children + increment,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/rooms', { state: { data: bookingDetails } });
  };

  return (
    <section className="section__container booking__container">
      <form action="" className="booking__form">
        <div className="input__group">
          <span><i className="ri-calendar-2-fill"></i></span>
          <div>
            <label htmlFor="check-in">CHECK-IN</label>
            <DatePicker
              selected={bookingDetails.checkInDate}
              onChange={handleCheckInChange}
              minDate={new Date()}
              dateFormat="dd-MM-yyyy"
              placeholderText="DD-MM-YYYY"
              className="custom-datepicker check-in-picker"
              id="check-in"
              customInput={
                <input
                  type="text"
                  id="check-in"
                  value={bookingDetails.checkInDate ? formatDate(bookingDetails.checkInDate) : ''}
                  readOnly
                />
              }
            />
          </div>
        </div>
        <div className="input__group">
          <span><i className="ri-calendar-2-fill"></i></span>
          <div>
            <label htmlFor="check-out">CHECK-OUT</label>
            <DatePicker
              selected={bookingDetails.checkOutDate}
              onChange={handleCheckOutChange}
              minDate={bookingDetails.checkInDate ? new Date(bookingDetails.checkInDate.getTime() + 86400000) : new Date()}
              dateFormat="dd-MM-yyyy"
              placeholderText="DD-MM-YYYY"
               className="custom-datepicker check-out-picker"
              customInput={
                <input
                  type="text"
                  id="check-out"
                  value={bookingDetails.checkOutDate ? formatDate(bookingDetails.checkOutDate) : ''}
                  readOnly
                />
              }
            />
          </div>
        </div>
        <div className="input__group">
          <span><i className="ri-user-fill"></i></span>
          <div>
            <label htmlFor="guest">GUEST</label>
            <input
              type="text"
              placeholder={`Adults: ${bookingDetails.adults}, Children: ${bookingDetails.children}`}
              name="guest"
              id="guest"
              readOnly
              onClick={toggleGuestPopup}
            />
          </div>
        </div>
        <div className="input__group input__btn">
          <button className="btn" onClick={handleSearch} id='search-btn'>Search</button>
        </div>
      </form>

      {guestPopupVisible && (
        <div className="guest__popup">
          <div className="popup__content">
            <div className="popup__item">
              <span>Adults</span>
              <button onClick={() => handleAdultChange(-1)} disabled={bookingDetails.adults <= 1}>-</button>
              <span>{bookingDetails.adults}</span>
              <button onClick={() => handleAdultChange(1)}>+</button>
            </div>
            <div className="popup__item">
              <span>Children</span>
              <button onClick={() => handleChildrenChange(-1)} disabled={bookingDetails.children <= 0}>-</button>
              <span>{bookingDetails.children}</span>
              <button onClick={() => handleChildrenChange(1)}>+</button>
            </div>
            <button className="popup__close" onClick={toggleGuestPopup}>Set</button>
          </div>
        </div>
      )}
      <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
        <p>**Check-in time is 2 PM and Check-out time is 11 AM.</p>
      </div>
    </section>
  );
}

export default Checkin;
