import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StaffSignin from "./Staffsignin";
import App from "./App";
import {
  Dashboard,
  Roomadd,
  Reservation,
  Showroom,
  MyProfile,
  Viewjobs,
  Applyleave,
  ViewLeaveStatus,
  CheckIn,
  Checkout,
  ReserveRoom,
  GuestDetails,
  ConfirmRoom,
  Team,
  Invoices,
  Viewstaff,
  Viewassignedjobs,
  ReservationDetails,
  Form,
  Bar,
  Line,
  Pie,
  FAQ,
  Geography,
  Calendar,
  Stream,
} from "./scenes";


const AppRouter = () => {
  return (
    <Router>
      <Routes>
        
        <Route path="/stafflogin" element={<StaffSignin />} /> 
        <Route path="/dashboard" element={<App />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/myprofile" element={<MyProfile />} />
          <Route path="/dashboard/viewjobs" element={<Viewjobs />} />
          <Route path="/dashboard/applyleave" element={<Applyleave />} />
          <Route path="/dashboard/viewleavestatus" element={<ViewLeaveStatus />} />
          <Route path="/dashboard/roomadd" element={<Roomadd />} />
          <Route path="/dashboard/reservations" element={<Reservation />} />
          <Route path="/dashboard/showrooms" element={<Showroom />} />
          <Route path="/dashboard/team" element={<Team />} />
          <Route path="/dashboard/viewstaff" element={<Viewstaff />} />
          <Route path="/dashboard/viewassignedjobs" element={<Viewassignedjobs />} />
          <Route path="/dashboard/checkin" element={<CheckIn />} />
          <Route path="/dashboard/checkout" element={<Checkout />} />
          <Route path="/dashboard/reserveroom" element={<ReserveRoom />} />
          <Route path="/dashboard/guestdetails" element={<GuestDetails />} />
          <Route path="/dashboard/confirmreservation" element={<ConfirmRoom />} />
          <Route path="/dashboard/viewallreservations" element={<Reservation />} />
          <Route path="/dashboard/reservation-details/:id" element={<ReservationDetails />} />
          <Route path="/dashboard/invoices" element={<Invoices />} />
          <Route path="/dashboard/form" element={<Form />} />
          <Route path="/dashboard/calendar" element={<Calendar />} />
          <Route path="/dashboard/bar" element={<Bar />} />
          <Route path="/dashboard/pie" element={<Pie />} />
          <Route path="/dashboard/stream" element={<Stream />} />
          <Route path="/dashboard/line" element={<Line />} />
          <Route path="/dashboard/faq" element={<FAQ />} />
          <Route path="/dashboard/geography" element={<Geography />} />
        </Route>
        
      </Routes>
    </Router>
  );
};

export default AppRouter;
