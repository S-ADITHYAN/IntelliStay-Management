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


    
  const photos = [
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261707778.jpg?k=56ba0babbcbbfeb3d3e911728831dcbc390ed2cb16c51d88159f82bf751d04c6&o=&hp=1",
    },
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261707367.jpg?k=cbacfdeb8404af56a1a94812575d96f6b80f6740fd491d02c6fc3912a16d8757&o=&hp=1",
    },
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261708745.jpg?k=1aae4678d645c63e0d90cdae8127b15f1e3232d4739bdf387a6578dc3b14bdfd&o=&hp=1",
    },
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261707776.jpg?k=054bb3e27c9e58d3bb1110349eb5e6e24dacd53fbb0316b9e2519b2bf3c520ae&o=&hp=1",
    },
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261708693.jpg?k=ea210b4fa329fe302eab55dd9818c0571afba2abd2225ca3a36457f9afa74e94&o=&hp=1",
    },
    {
      src: "https://cf.bstatic.com/xdata/images/hotel/max1280x900/261707389.jpg?k=52156673f9eb6d5d99d3eed9386491a0465ce6f3b995f005ac71abc192dd5827&o=&hp=1",
    },
  ];

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? 5 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === 5 ? 0 : slideNumber + 1;
    }

    setSlideNumber(newSlideNumber)
  };

  return (
    <div>
      <div className='room_nav'>
      <Header  /> 
      </div>
      <div className="hotelContainer">
        {open && (
          <div className="slider">
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="close"
              onClick={() => setOpen(false)}
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
            <span>Elton St 125 New york</span>
          </div>
          <span className="hotelDistance">
            Excellent location – 500m from center
          </span>
          <span className="hotelPriceHighlight">
            Book a stay over ₹{roomdatas.rate} at this property and get a free airport taxi
          </span>
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
          <div className="hotelDetails">
            <div className="hotelDetailsTexts">
              <h1 className="hotelTitle">Stay in the heart of City</h1>
              <p className="hotelDesc">
                Located a 5-minute walk from St. Florian's Gate in Krakow, Tower
                Street Apartments has accommodations with air conditioning and
                free WiFi. The units come with hardwood floors and feature a
                fully equipped kitchenette with a microwave, a flat-screen TV,
                and a private bathroom with shower and a hairdryer. A fridge is
                also offered, as well as an electric tea pot and a coffee
                machine. Popular points of interest near the apartment include
                Cloth Hall, Main Market Square and Town Hall Tower. The nearest
                airport is John Paul II International Kraków–Balice, 16.1 km
                from Tower Street Apartments, and the property offers a paid
                airport shuttle service.
              </p>
            </div>
            <div className="hotelDetailsPrice">
              <h1>Perfect for a {differenceInDaysString}-night stay!</h1>
              <span>
                Located in the real heart of Krakow, this property has an
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