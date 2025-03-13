import './RoomInfo.css';
import axios from 'axios'; 
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import {
  faCircleArrowLeft,
  faCircleArrowRight,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useMemo } from "react";
import Swal from 'sweetalert2';
import Footer from '../components/footer';

const RoomInfo = () => {
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state with default values
  const state = location.state || {};
  const datas = state.data || {};
  const roomdatas = state.roomdata || {};
  const allocation = state.allocation || {};
  console.log("allocation", allocation)
  console.log("roomdatas", roomdatas)
  // const guestDistribution = state.guestDistribution || {};
  // console.log("guestDistribution", guestDistribution)
  // console.log("datas", datas)
  // console.log("roomdatas", roomdatas)
  // Calculate date difference and rates - using useMemo to prevent recalculation
  const dateCalculation = useMemo(() => {
    try {
      const checkOut = new Date(datas.checkOutDate);
      const checkIn = new Date(datas.checkInDate);
      
      // Validate dates
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error('Invalid date(s)');
        return { differenceInDays: 0, totalRate: 0 };
      }

      // Calculate difference in days
      const differenceInTime = checkOut.getTime() - checkIn.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      
      // Validate room rate
      const rate = parseFloat(roomdatas.rate) || 0;
      
      return {
        differenceInDays,
        totalRate: rate * differenceInDays
      };
      
    } catch (error) {
      console.error('Error calculating dates:', error);
      return { differenceInDays: 0, totalRate: 0 };
    }
  }, [datas.checkInDate, datas.checkOutDate, roomdatas.rate]);

  // Calculate required rooms - using useMemo to prevent recalculation
  const roomCalculation = useMemo(() => {
    try {
      console.log("roomdatas innn", roomdatas);
      const { allowedAdults, allowedChildren } = roomdatas;
      const requestedAdults = parseInt(datas.adults) || 0;
      const requestedChildren = parseInt(datas.children) || 0;

      // Calculate rooms needed based on adults and children
      let roomsForAdults, roomsForChildren;

      // If requested adults/children are less than or equal to allowed capacity, assign 1 room
      if (requestedAdults <= allowedAdults && requestedChildren <= allowedChildren) {
        roomsForAdults = 1;
        roomsForChildren = 1;
      } else {
        // Otherwise calculate rooms needed
        roomsForAdults = Math.ceil(requestedAdults / allowedAdults);
        roomsForChildren = Math.ceil(requestedChildren / allowedChildren);
      }

      // Take the maximum of the two calculations
      const totalRoomsRequired = Math.max(roomsForAdults, roomsForChildren);

      // Calculate total rate for all rooms
      const totalRate = totalRoomsRequired * dateCalculation.totalRate;

      return {
        totalRooms: totalRoomsRequired,
        totalRate,
        breakdown: {
          adults: {
            requested: requestedAdults,
            allowed: allowedAdults,
            roomsNeeded: roomsForAdults,
            withinCapacity: requestedAdults <= allowedAdults
          },
          children: {
            requested: requestedChildren,
            allowed: allowedChildren,
            roomsNeeded: roomsForChildren,
            withinCapacity: requestedChildren <= allowedChildren
          }
        }
      };
    } catch (error) {
      console.error('Error calculating rooms:', error);
      return {
        totalRooms: 0,
        totalRate: 0,
        breakdown: {
          adults: { requested: 0, allowed: 0, roomsNeeded: 0, withinCapacity: false },
          children: { requested: 0, allowed: 0, roomsNeeded: 0, withinCapacity: false }
        }
      };
    }
  }, [datas.adults, datas.children, roomdatas.allowedAdults, roomdatas.allowedChildren, dateCalculation.totalRate]);

  const handleBook = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/signup');
    } else {
      navigate('/guestdetails', {
        state: {
          data: datas,
          roomdata: roomdatas,
          totalRate: roomCalculation.totalRate,
          totalDays: dateCalculation.differenceInDays,
          requiredRooms: roomCalculation.totalRooms
        }
      });
    }
  };

  const photos = useMemo(() => {
    return (roomdatas.images || []).map(photo => ({
      src: `${import.meta.env.VITE_API}/uploads/${photo}`,
    }));
  }, [roomdatas.images]);

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    const totalImages = photos.length;
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? totalImages - 1 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === totalImages - 1 ? 0 : slideNumber + 1;
    }
    
    setSlideNumber(newSlideNumber);
  };

  return (
    <div>
      <div className='room_nav'>
        <Header /> 
      </div>
      <div className="hotelContainer">
        {open && (
          <div className="slider">
            <CloseIcon
              className="close"
              onClick={() => setOpen(false)}
              style={{ cursor: 'pointer' }}
            />
            <FontAwesomeIcon
              icon={faCircleArrowLeft}
              className="arrow"
              onClick={() => handleMove("l")}
            />
            <div className="sliderWrapper">
              <img src={photos[slideNumber].src} alt="" className="sliderImg" />
            </div>
            <FontAwesomeIcon
              icon={faCircleArrowRight}
              className="arrow"
              onClick={() => handleMove("r")}
            />
          </div>
        )}
        
        <div className="hotelWrapper">
          <button className="bookNow" onClick={handleBook}>
            Reserve or Book Now! ₹{roomCalculation.totalRate.toLocaleString()} 
            ({dateCalculation.differenceInDays} nights, {roomCalculation.totalRooms} {roomCalculation.totalRooms > 1 ? 'rooms' : 'room'})
          </button>

          <h1 className="hotelTitle">{roomdatas.roomtype}</h1>
          <div className="hotelAddress">
            <FontAwesomeIcon icon={faLocationDot} />
            <span>Kochi</span>
          </div>

          <div className="hotelImages">
            {photos.map((photo, i) => (
              <div className="hotelImgWrapper" key={i}>
                <img
                  onClick={() => handleOpen(i)}
                  src={photo.src}
                  alt=""
                  className="hotelImg"
                />
              </div>
            ))}
          </div>

          <div className="hotelDetails" style={{ marginBottom: '100px' }}>
            <div className="hotelDetailsTexts">
              {/* <div className="room-capacity-info">
                <h3>Room Capacity & Booking Details</h3>
                <div className="capacity-details">
                  <div className="capacity-item">
                    <span className="label">Maximum Adults per Room:</span>
                    <span className="value">{roomdatas.allowedAdults}</span>
                  </div>
                  <div className="capacity-item">
                    <span className="label">Maximum Children per Room:</span>
                    <span className="value">{roomdatas.allowedChildren}</span>
                  </div>
                  <div className="capacity-item">
                    <span className="label">Your Request:</span>
                    <span className="value">
                      {datas.adults} Adults, {datas.children} Children
                    </span>
                  </div>
                  <div className="capacity-item total-rooms">
                    <span className="label">Required Rooms:</span>
                    <span className="value">{roomCalculation.totalRooms}</span>
                  </div>
                  <div className="room-breakdown">
                    <p>Room Allocation Breakdown:</p>
                    <ul>
                      <li>
                        Adults: {roomCalculation.breakdown.adults.requested} persons
                        ÷ {roomCalculation.breakdown.adults.allowed} per room
                        = {roomCalculation.breakdown.adults.roomsNeeded} rooms needed
                      </li>
                      <li>
                        Children: {roomCalculation.breakdown.children.requested} persons
                        ÷ {roomCalculation.breakdown.children.allowed} per room
                        = {roomCalculation.breakdown.children.roomsNeeded} rooms needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div> */}

              <h1 className="hotelTitle">Stay in the heart of City</h1>
              <p className="hotelDesc">{roomdatas.description}</p>
              
              {/* Add Amenities Section */}
              <div className="amenities-section">
                <h3>In-Room Amenities</h3>
                <div className="amenities-grid">
                  {roomdatas.amenities && typeof roomdatas.amenities === 'string' ? 
                    roomdatas.amenities.split(',').map((amenity, index) => (
                      amenity.trim() && (  // Only render if amenity is not empty
                        <div key={index} className="amenity-item">
                          <span className="amenity-icon">•</span>
                          <span className="amenity-text">{amenity.trim()}</span>
                        </div>
                      )
                    ))
                    : 
                    <div className="amenity-item">
                      <span className="amenity-text">No amenities listed</span>
                    </div>
                  }
                </div>
              </div>

            </div>

            <div className="hotelDetailsPrice" >
              <h1>Perfect for a {dateCalculation.differenceInDays}-night stay!</h1>
              <span>
                Located in the real heart of Kochi, this property has an
                excellent location score of 9.8!
              </span>
              <h2>
                <b>₹{roomCalculation.totalRate.toLocaleString()}</b> 
                ({dateCalculation.differenceInDays} nights, {roomCalculation.totalRooms} {roomCalculation.totalRooms > 1 ? 'rooms' : 'room'})
              </h2>
              <button onClick={handleBook}>Reserve or Book Now!</button>
            </div>
          </div>
        </div>
      </div>
      <div>

      </div>
      <div className='footer'>
      <Footer/>
    </div>
    </div>
  );
};

export default RoomInfo;