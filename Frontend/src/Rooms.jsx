import React, { useEffect, useState,useRef } from 'react';
import axios from 'axios'; // Ensure axios is imported
import Header from '../components/Header';
import './Rooms.css';
import room1 from '../src/assets/room-1.jpg';
import room2 from '../src/assets/room-2.jpg';
import room3 from '../src/assets/room-3.jpg';
import Checkin from '../components/checkin';
import logo from '../public/logo1.png';
import facebook from './assets/facebook.png';
import instagram from './assets/instagram.png';
import youtube from './assets/youtube.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormControl, InputLabel, Select, MenuItem, Slider, Box, Typography } from '@mui/material';
import Footer from '../components/footer';
import Swal from 'sweetalert2';
import { getRecommendations } from './services/recommendationService';


function Rooms() {
  
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const location = useLocation();
  const state = location.state || {};
  const searchdata = state.data || {};
  const [roomNeed, setRoomNeed] = useState();
  const footerRef = useRef(null);
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]); // Adjust max value as needed
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);

  const checkrooms = () => {
    axios.post(`${import.meta.env.VITE_API}/user/checkrooms`, { searchdata })
      .then(res => {
        if (res.status === 200) {
          const { availableRooms, roomsNeeded, roomsAvailable, message } = res.data;
          console.log(res.data);
          // Handle the case where not enough rooms are available
          if (availableRooms.length < roomsNeeded) {
            console.log(message);
            console.log(`Rooms needed: ${roomsNeeded}, Rooms available: ${roomsAvailable}`);
          } else {
            console.log(message);
            setRoomNeed(roomsNeeded);
            setRooms(availableRooms); // Set only the available rooms to state
          }
        }
      })
      .catch(err => {
        console.error("Error", err);
      });
  };

  // Add this function to fetch recommendations
  const fetchRecommendations = async () => {
    const userId = localStorage.getItem('userId');
     // Assuming you store userId in localStorage
    if (!userId) return;

    const recommendations = await getRecommendations(userId, searchdata);
    // console.log("recommendations",recommendations.userPreferences);
    if (recommendations) {
      setRecommendedRooms(recommendations.recommendedRooms);
      setUserPreferences(recommendations.userPreferences);
      console.log("userPreferences",recommendations.userPreferences)
    }
  };

  useEffect(() => {
    checkrooms();
    fetchRecommendations();
  }, [searchdata]);

  // useEffect(() => {
  //   // const footer = footerRef.current;
  //   // let lastScrollY = window.pageYOffset;
  //   // // let footerHeight = footer.offsetHeight;
  //   // let viewportHeight = window.innerHeight;
  //   // let documentHeight = document.documentElement.scrollHeight;
  
  //   // const handleScroll = () => {
  //   //   const currentScrollY = window.pageYOffset;
  //   //   const maxScroll = documentHeight - viewportHeight;
  //   //   const scrollPercentage = currentScrollY / maxScroll;
  //   //   const footerVisibleHeight = Math.min(footerHeight, Math.max(50, scrollPercentage * footerHeight));
  
  //   //   if (currentScrollY < lastScrollY) {
  //   //     // Scrolling up
  //   //     footer.style.transform = `translateY(calc(100% - ${footerVisibleHeight}px))`;
  //   //   } else {
  //   //     // Scrolling down
  //   //     footer.style.transform = 'translateY(calc(100% - 50px))';
  //   //   }
  //   //   lastScrollY = currentScrollY;
  //   // };
  
  //   const handleResize = () => {
  //     footerHeight = footer.offsetHeight;
  //     viewportHeight = window.innerHeight;
  //     documentHeight = document.documentElement.scrollHeight;
  //   };
  
  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   window.addEventListener('resize', handleResize);
  
  //   return () => {
  //     window.removeEventListener('scroll', handleScroll);
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  // Function to group rooms by roomtype
  const groupByRoomType = (rooms) => {
    const groupedRooms = {};
    rooms.forEach((room) => {
      if (!groupedRooms[room.roomtype]) {
        groupedRooms[room.roomtype] = [];
      }
      groupedRooms[room.roomtype].push(room);
    });
    return groupedRooms;
  };

  const groupedRooms = groupByRoomType(rooms);

  // Add this helper function to calculate required rooms
  const calculateRequiredRooms = (roomtype) => {
    const roomsOfType = groupedRooms[roomtype];
    if (!roomsOfType || roomsOfType.length === 0) return null;

    const totalAdults = searchdata.adults;
    const totalChildren = searchdata.children;
    const sampleRoom = roomsOfType[0]; // Get room capacity details

    // Calculate how many rooms needed based on capacity
    const roomsNeededForAdults = Math.ceil(totalAdults / sampleRoom.allowedAdults);
    const roomsNeededForChildren = Math.ceil(totalChildren / sampleRoom.allowedChildren);
    
    // Take the maximum to ensure enough rooms for both adults and children
    const totalRoomsNeeded = Math.max(roomsNeededForAdults, roomsNeededForChildren);

    // Check if we have enough available rooms
    if (roomsOfType.length < totalRoomsNeeded) {
      return null; // Not enough rooms of this type
    }

    // Select required number of rooms
    const selectedRooms = [];
    const availableRooms = [...roomsOfType];

    for (let i = 0; i < totalRoomsNeeded; i++) {
      const randomIndex = Math.floor(Math.random() * availableRooms.length);
      selectedRooms.push(availableRooms.splice(randomIndex, 1)[0]);
    }

    return {
      rooms: selectedRooms,
      count: totalRoomsNeeded,
      distribution: {
        adults: Math.ceil(totalAdults / totalRoomsNeeded),
        children: Math.ceil(totalChildren / totalRoomsNeeded)
      }
    };
  };

  // Update the handleRoomBooking function
  const handleRoomBooking = (roomtype) => {
    const roomAllocation = calculateRequiredRooms(roomtype);
    
    if (!roomAllocation) {
      Swal.fire({
        icon: 'error',
        title: 'Not Enough Rooms',
        text: `We don't have enough ${roomtype} rooms to accommodate your group. Please try a different room type or adjust your group size.`,
        showConfirmButton: true
      });
      return;
    }

    // Show room allocation confirmation
    Swal.fire({
      icon: 'info',
      title: 'Room Allocation',
      html: `
        <div class="room-allocation-info">
          <p>Based on your group size, you need ${roomAllocation.count} ${roomtype} room(s):</p>
          <ul>
            <li>Adults per room: ${roomAllocation.distribution.adults}</li>
            <li>Children per room: ${roomAllocation.distribution.children}</li>
          </ul>
          <p>Total: ${roomAllocation.count} room(s) for ${searchdata.adults} adults and ${searchdata.children} children</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Proceed with Booking',
      cancelButtonText: 'Cancel',
      customClass: {
        container: 'room-allocation-container'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/roominfo', { 
          state: { 
            data: searchdata, 
            roomdata: roomAllocation.rooms[0],
            allocation: {
              totalRooms: roomAllocation.count,
              rooms: roomAllocation.rooms,
              distribution: roomAllocation.distribution
            }
          } 
        });
      }
    });
  };

  // Add this function to get unique room types
  const getRoomTypes = () => {
    const types = [...new Set(rooms.map(room => room.roomtype))];
    return ['all', ...types];
  };

  // Add this function to handle price range changes
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  // Add this function to handle room type changes
  const handleRoomTypeChange = (event) => {
    setSelectedRoomType(event.target.value);
  };

  // Modify the useEffect to include filtering
  useEffect(() => {
    let filtered = [...rooms];

    // Filter by room type
    if (selectedRoomType !== 'all') {
      filtered = filtered.filter(room => room.roomtype === selectedRoomType);
    }

    // Filter by price range
    filtered = filtered.filter(room => 
      room.rate >= priceRange[0] && room.rate <= priceRange[1]
    );

    setFilteredRooms(filtered);
  }, [rooms, selectedRoomType, priceRange]);

  // Add this function to check if a room is recommended
  const isRecommended = (room) => {
    // console.log("room",room)
    // console.log("recommendedRooms",recommendedRooms)
    return recommendedRooms.some(rec => rec.roomtype === room.roomtype);
  };

  // Add this component for recommendation explanation
  const RecommendationExplanation = ({ preferences }) => {
    if (!preferences) return null;

    return (
      <Box sx={{
        padding: '15px',
        backgroundColor: '#f8f4ff',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0d4ff'
      }}>
        <Typography variant="h6" sx={{ color: '#5c2db0', marginBottom: '10px' }}>
          Personalized Recommendations
        </Typography>
        <Typography variant="body2">
          Based on your previous stays, we noticed you prefer:
          <ul>
            {preferences.preferredRoomTypes && (
              <li>Room types similar to: {preferences.preferredRoomTypes.join(', ')}</li>
            )}
            {preferences.averageStayDuration && (
              <li>Average stay duration: {preferences.averageStayDuration} nights</li>
            )}
            {preferences.preferredAmenities && (
              <li>Amenities you enjoy: {preferences.preferredAmenities.join(', ')}</li>
            )}
          </ul>
        </Typography>
      </Box>
    );
  };

  // Update your room card rendering
  const RoomCard = ({ room, isRecommended }) => (
    console.log("isRecommended",isRecommended),
    <div className={`room__card ${isRecommended ? 'recommended' : ''}`}>
      <div className="room__card__image">
        <img 
          src={(room.images.length > 0) ? 
            `${import.meta.env.VITE_API}/uploads/${room.images[0]}` : 
            room1
          } 
          alt="room" 
        />
        {isRecommended && (
          <div className="recommendation-badge">
            <span>✨ Recommended for You</span>
          </div>
        )}
        <div className="room__card__icons">
          <span><i className="ri-heart-fill"></i></span>
          <span><i className="ri-paint-fill"></i></span>
          <span><i className="ri-shield-star-line"></i></span>
        </div>
      </div>
      <div className="room__card__details">
        <h4>{room.roomtype}</h4>
        {isRecommended && (
          <div className="recommendation-reason">
            <p style={{ 
              color: '#5c2db0', 
              fontSize: '0.9em', 
              marginTop: '5px',
              fontStyle: 'italic' 
            }}>
              Matches your preferred room type
            </p>
          </div>
        )}
        <div className="room__capacity">
          <p>Capacity per room:</p>
          <ul>
            <li>Adults: {room.allowedAdults}</li>
            <li>Children: {room.allowedChildren}</li>
          </ul>
        </div>
        <h5>Starting from <span>₹{room.rate}/night</span></h5>
        <button 
          className={`btn ${isRecommended ? 'btn-recommended' : ''}`}
          id='details' 
          onClick={() => handleRoomBooking(room.roomtype)}
        >
          {isRecommended ? (
            <>
              <span className="star-icon">★</span>
              Book Recommended Room
            </>
          ) : 'See Details'}
        </button>
      </div>
    </div>
  );

  // Add this component for the filter section
  const FilterSection = () => (
    <Box sx={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '8px',
      margin: '20px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Typography variant="h6" gutterBottom>
        Filter Rooms
      </Typography>
      
      <Box sx={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Room Type Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Room Type</InputLabel>
          <Select
            value={selectedRoomType}
            onChange={handleRoomTypeChange}
            label="Room Type"
          >
            {getRoomTypes().map(type => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Price Range Filter */}
        <Box sx={{ width: 300 }}>
          <Typography gutterBottom>
            Price Range (₹)
          </Typography>
          <Slider
            value={priceRange}
            onChange={handlePriceRangeChange}
            valueLabelDisplay="auto"
            min={0}
            max={10000} // Adjust based on your price range
            step={500}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">₹{priceRange[0]}</Typography>
            <Typography variant="body2">₹{priceRange[1]}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <div id='room-page'>
      <div className='room_nav'>
        <Header />
      </div>
      <Checkin searchdata={searchdata} />
      <section className="section__container room__container">
        <p className="section__subheader" style={{ color: 'red' }}>
          {`You need to book ${roomNeed} rooms for ${searchdata.adults} adults and ${searchdata.children} child`}
        </p>
        <p className="section__subheader">OUR LIVING ROOM</p>
        <h2 className="section__header">The Most Memorable Rest Time Starts Here.</h2>
        
        {userPreferences && <RecommendationExplanation preferences={userPreferences} />}
        
        {/* Add the filter section */}
        <FilterSection />

        {/* Show number of results */}
        <Typography variant="body1" sx={{ margin: '20px 0' }}>
          Showing {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
        </Typography>

        <div className="room__grid">
          {Object.keys(groupByRoomType(filteredRooms)).map((roomtype) => {
            const roomsOfType = groupByRoomType(filteredRooms)[roomtype];
            const room = roomsOfType[0];
            return (
              <RoomCard 
                key={room._id} 
                room={room} 
                isRecommended={isRecommended(room)}
              />
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center', 
              margin: '40px 0',
              color: '#666'
            }}
          >
            No rooms found matching your criteria
          </Typography>
        )}
      </section>
      {/* <footer className="footer" ref={footerRef} id="contact">
        <div className="section__container footer__container">
          <div className="footer__col">
            <div className="logo">
              <a href="#home"><img src={logo} alt="logo" /></a>
            </div>
            <p className="section__description">
              Discover a world of comfort, luxury, and adventure as you explore
              our curated selection of hotels, making every moment of your getaway
              truly extraordinary.
            </p>
            <button className="btn">Book Now</button>
          </div>
          <div className="footer__col">
            <h4>QUICK LINKS</h4>
            <ul className="footer__links">
              <li><a href="#">Browse Destinations</a></li>
              <li><a href="#">Special Offers & Packages</a></li>
              <li><a href="#">Room Types & Amenities</a></li>
              <li><a href="#">Customer Reviews & Ratings</a></li>
              <li><a href="#">Travel Tips & Guides</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>OUR SERVICES</h4>
            <ul className="footer__links">
              <li><a href="#">Concierge Assistance</a></li>
              <li><a href="#">Flexible Booking Options</a></li>
              <li><a href="#">Airport Transfers</a></li>
              <li><a href="#">Wellness & Recreation</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>CONTACT US</h4>
            <ul className="footer__links">
              <li><a href="#">intellistay@info.com</a></li>
            </ul>
            <div className="footer__socials">
              <a href="#"><img src={facebook} alt="facebook" /></a>
              <a href="#"><img src={instagram} alt="instagram" /></a>
              <a href="#"><img src={youtube} alt="youtube" /></a>
            </div>
          </div>
        </div>
        <div className="footer__bar">
          Copyright © 2024 INTELLISTAY Pvt.LTD. All rights reserved.
        </div>
      </footer> */}
      <div className='footer'>
      <Footer/>
    </div>
    </div>
  );
}

export default Rooms;
