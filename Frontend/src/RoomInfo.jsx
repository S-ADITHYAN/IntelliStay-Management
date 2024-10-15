import './RoomInfo.css';
// import Navbar from "../../components/navbar/Navbar";
// import Header from "../../components/header/Header";
// import MailList from "../../components/mailList/MailList";
// import Footer from "../../components/footer/Footer";
import axios from 'axios'; 
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation,useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import CloseIcon from '@mui/icons-material/Close';

import {
  faCircleArrowLeft,
  faCircleArrowRight,
  faCircleXmark,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Swal from 'sweetalert2';

const RoomInfo = () => {
  useAuth();
    const [ddifferenceInDays,setdifferenceInDays]=useState();
    const [ttrate,setttrate]=useState();
    const navigate=useNavigate();
    const location = useLocation();
    console.log(location);
    const state = location.state || {};
  const datas = state.data || {};
  const roomdatas = state.roomdata || {};
  console.log(datas);
  console.log("roominfo",roomdatas);
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const checkOut=new Date(datas.checkOutDate);
  const checkIn=new Date(datas.checkInDate);
    const rrate=roomdatas.rate;
    
    console.log('checkIn type:', typeof checkIn);
console.log('checkOut type:', typeof checkOut);

// Check if dates are valid
if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
  console.error('Invalid date(s)');
} else {
  const differenceInTime = checkOut - checkIn;
  
  // Convert milliseconds to days
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  
  // Convert to string and check validity
  var differenceInDaysString = differenceInDays.toString();
  console.log('Difference in days:', differenceInDaysString);
  
  
  // Convert rrate to a number
  const numericRrate = Number(rrate);
  
  if (isNaN(numericRrate)) {
    console.error('Invalid rate value');
  } else {
    // Calculate trate
    const trate = numericRrate * differenceInDays;
    
    // Convert trate to string
    var trateString = trate.toString();
    console.log('Trate:', trateString);
    
  }
}


const handleBook=()=>{
 const userid= localStorage.getItem('userId');
 const trate=trateString;
 if(!userid)
{
  navigate('/signup');
}
else{
  navigate('/guestdetails',{state:{data: datas,roomdata:roomdatas,totlrate: trateString,totldays:differenceInDaysString}});
  // axios.post("http://localhost:3001/confirmbook", { roomdatas,datas,userid,trateString })
  // .then(res => {
  //   if (res.status === 200) {
  //     Swal.fire("booking succesful");
  //   }
  //   else{
  //     Swal.fire(error);
  //   }
  // })
  // .catch(err => {
  //   console.error("Error", err);
  // });
};
}


    
const photos = roomdatas.images.map(photo => ({
  src: `http://localhost:3001/uploads/${photo}`,
}));

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;
  
    // Get the total number of images
    const totalImages = photos.length;
  
    if (direction === "l") {
      // Move left (to previous image)
      newSlideNumber = slideNumber === 0 ? totalImages - 1 : slideNumber - 1;
    } else {
      // Move right (to next image)
      newSlideNumber = slideNumber === totalImages - 1 ? 0 : slideNumber + 1;
    }
  
    setSlideNumber(newSlideNumber);
  };

  return (
    <div>
      <div className='room_nav'>
      <Header  /> 
      </div>
      <div className="hotelContainer">
        {open && (
          <div className="slider">
            <CloseIcon
              className="close"
              onClick={() => setOpen(false)}
              style={{ cursor: 'pointer' }} // Adding cursor pointer for better UX
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
           <button className="bookNow"  onClick={handleBook}>Reserve or Book Now! ₹{trateString} ({differenceInDaysString} nights) </button> 
          <h1 className="hotelTitle">{roomdatas.roomtype}</h1>
          <div className="hotelAddress">
            <FontAwesomeIcon icon={faLocationDot} />
            <span>Kochi</span>
          </div>
          <span className="hotelDistance">
            Excellent location – 500m from MG road,Kochi
          </span>
          <span className="hotelPriceHighlight">
            Book a stay over ₹{roomdatas.rate} at this property and get a free airport taxi
          </span>
          <div className="hotelImages">
            {roomdatas.images.map((photo, i) => (
              <div className="hotelImgWrapper" key={i}>
                <img
                  onClick={() => handleOpen(i)}
                  src={`http://localhost:3001/uploads/${photo}`}
                  alt=""
                  className="hotelImg"
                />
              </div>
            ))}
          </div>
          <div className="hotelDetails">
            <div className="hotelDetailsTexts">
              <h1 className="hotelTitle">Stay in the heart of City</h1>
              <p className="hotelDesc">
                {roomdatas.description}
              </p>
              <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
        <p>**Check-in time is 2 PM and Check-out time is 11 AM.</p>
      </div>
      <div style={{ fontSize: '14px', marginTop: '10px' }}>
  <h4>In-Room Amenities:</h4>
  <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
    
    <li>55” smart IPTV</li>
    <li>Luxury bathroom with walk-in shower and bathtub</li>
    <li>Deluxe French Note bathroom amenities</li>
    <li>Hair dryer</li>
    <li>Stocked refreshments</li>
    <li>Iron and ironing board</li>
    <li>In-room safe</li>
    <li>Crib and rollaway bed on request</li>
    <li>Complimentary Wi-Fi</li>
    <li>Complimentary bottled mineral water</li>
  </ul>
</div>
            </div>
            <div className="hotelDetailsPrice">
              <h1>Perfect for a {differenceInDaysString}-night stay!</h1>
              <span>
                Located in the real heart of Kochi, this property has an
                excellent location score of 9.8!
              </span>
              <h2>
                <b>₹{trateString}</b> ({differenceInDaysString} nights)
              </h2>
              <button onClick={handleBook}>Reserve or Book Now!</button>
            </div>
          </div>
        </div>
        {/* <MailList />
        <Footer /> */}
      </div>
    </div>
  );
};

export default RoomInfo;