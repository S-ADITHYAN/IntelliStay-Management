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

  useEffect(() => {
    checkrooms();
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

  // Function to randomly select a room for booking from the available rooms of the same roomtype
  const handleRoomBooking = (roomtype) => {
    
    const roomsOfType = groupedRooms[roomtype];
    if (roomsOfType.length > 0) {
      const randomRoom = roomsOfType[Math.floor(Math.random() * roomsOfType.length)];
      navigate('/roominfo', { state: { data: searchdata, roomdata: randomRoom } });
    }
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
              <div key={room._id} className="room__card">
                <div className="room__card__image">
                  <img src={(room.images.length > 0) ? `${import.meta.env.VITE_API}/uploads/${room.images[0]}` : room1} alt="room" />
                  <div className="room__card__icons">
                    <span><i className="ri-heart-fill"></i></span>
                    <span><i className="ri-paint-fill"></i></span>
                    <span><i className="ri-shield-star-line"></i></span>
                  </div>
                </div>
                <div className="room__card__details">
                  <h4>{room.roomtype}</h4>
                  <p>{room.description}</p>
                  <h5>Starting from <span>₹{room.rate}/night</span></h5>
                  <button className="btn" id='details' onClick={() => handleRoomBooking(room.roomtype)}>See Details</button>
                </div>
              </div>
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
