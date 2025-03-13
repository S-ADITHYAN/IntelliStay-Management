import React,{useState} from "react"
import Signupin from './Signupin'
import Home from './home.jsx'
import Public from "./Public.jsx"
import { BrowserRouter,Routes,Route} from "react-router-dom"
import ManagerPanel from "./ManagerPanel.jsx"
import Rooms from "./Rooms.jsx"
import RoomInfo from "./RoomInfo.jsx"
import List from "./List.jsx"
import MyBookings from "../components/Mybookings/MyBookings.jsx"
import GuestDetailsForm from "./GuestDetailsForm.jsx"
import ReserveRoom from "./Roomreserve.jsx"
import MyProfile from "../components/profile/MyProfile.jsx"
import BookingDetails from '../components/bookingdetails/BookingDetails.jsx'
import SeeRoomDetails from "./SeeRoomDetails.jsx"
import SavedGuest from "../components/savedguest/savedguest.jsx"
import RestaurantRoutes from "./routes/RestaurantRoutes.jsx";
import Login from './Login.jsx';
import Guide from "./components/Guide/Guide.jsx";
import QRScanner from "../src/components/QRSystem/QRScanner.jsx";

function App(){

      return(
         <BrowserRouter>
            <Routes>
            <Route path='/' element={ <Home /> }></Route> 
            <Route path='/signup' element={ <Signupin /> }></Route>
            <Route path='/managerPanel' element={ <ManagerPanel /> }></Route>
            <Route path='/public' element={ <Public /> }></Route> 
            <Route path='/rooms' element={ <Rooms /> }></Route> 
            <Route path='/roominfo' element={ <RoomInfo /> }></Route> 
            <Route path='/list' element={ <List /> }></Route> 
            <Route path='/guestdetails' element={ <GuestDetailsForm /> }></Route> 
            <Route path='/reserveroom' element={ <ReserveRoom /> }></Route> 
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/myprofile" element={<MyProfile />} />
            <Route path="/booking-details/:bookingId" element={<BookingDetails />} />
            <Route path="/roomdetails" element={<SeeRoomDetails />} />
            <Route path="/saved-guests" element={<SavedGuest />} />
            <Route path="/restaurant/*" element={<RestaurantRoutes />} />
            <Route path="/restaurent_login" element={<Login />} /> 
            <Route path="/guide" element={<Guide />} />
            <Route path="/qrscanner" element={<QRScanner />} />
            
            </Routes>
         </BrowserRouter> 
      )
 }

 export default App;