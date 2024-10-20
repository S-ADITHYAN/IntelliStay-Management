import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Ensure axios is imported
import Header from '../components/Header';
import './Rooms.css';
import room1 from '../src/assets/room-1.jpg';
import room2 from '../src/assets/room-2.jpg';
import room3 from '../src/assets/room-3.jpg';
import Checkin from '../components/checkin';
import { useLocation, useNavigate } from 'react-router-dom';


function Rooms() {
  
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const location = useLocation();
  const state = location.state || {};
  const searchdata = state.data || {};
  const [roomNeed, setRoomNeed] = useState();

  const checkrooms = () => {
    axios.post("http://localhost:3001/checkrooms", { searchdata })
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

  return (
    <div>
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
        <div className="room__grid">
          {Object.keys(groupedRooms).map((roomtype) => {
            const roomsOfType = groupedRooms[roomtype];
            const room = roomsOfType[0]; // Display only the first room of this roomtype
            return (
              <div key={room._id} className="room__card">
                <div className="room__card__image">
                  <img src={(room.images.length > 0) ? `http://localhost:3001/uploads/${room.images[0]}` : room1} alt="room" />
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
                  <button className="btn" onClick={() => handleRoomBooking(room.roomtype)}>See Details</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Rooms;
