import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signin from "./Signupin";
import App from "./App";
import {
  Dashboard,
  Roomadd,
  Reservation,
  Showroom,
  Team,
  Invoices,
  Viewstaff,
  Viewassignedjobs,
  ReservationDetails,
  ManualJobAssignment,
  ViewLeaveApplications,
  RestaurantDashboard,
  MenuManagement,
  OrderManagement,
  ReservationManagement,
  TableManagement,
  AttendanceMark,
  Form,
  Bar,
  Line,
  Pie,
  FAQ,
  Geography,
  ViewFeedback,
  Calendar,
  Stream,
} from "./scenes";


const AppRouter = () => {
  return (
    <Router>
      <Routes>
        
        <Route path="/adminlogin" element={<Signin />} /> 
        <Route path="/admindashboard" element={<App />}>
          <Route path="/admindashboard" element={<Dashboard />} />
          <Route path="/admindashboard/restaurant" element={<RestaurantDashboard />} />
          <Route path="/admindashboard/restaurant/menu" element={<MenuManagement />} />
          <Route path="/admindashboard/restaurant/orders" element={<OrderManagement />} />
          <Route path="/admindashboard/restaurant/reservations" element={<ReservationManagement />} />
          <Route path="/admindashboard/restaurant/tables" element={<TableManagement />} />
          <Route path="/admindashboard/roomadd" element={<Roomadd />} />
          <Route path="/admindashboard/reservations" element={<Reservation />} />
          <Route path="/admindashboard/showrooms" element={<Showroom />} />
          <Route path="/admindashboard/team" element={<Team />} />
          <Route path="/admindashboard/viewstaff" element={<Viewstaff />} />
          <Route path="/admindashboard/viewassignedjobs" element={<Viewassignedjobs />} />
          <Route path="/admindashboard/jobassignment" element={<ManualJobAssignment />} />
          <Route path="/admindashboard/attendencemark" element={<AttendanceMark />} />
          <Route path="/admindashboard/viewleaveapplications" element={<ViewLeaveApplications />} />
          <Route path="/admindashboard/reservation-details/:id" element={<ReservationDetails />} />
          <Route path="/admindashboard/invoices" element={<Invoices />} />
          <Route path="/admindashboard/form" element={<Form />} />
          <Route path="/admindashboard/calendar" element={<Calendar />} />
          <Route path="/admindashboard/bar" element={<Bar />} />
          <Route path="/admindashboard/pie" element={<Pie />} />
          <Route path="/admindashboard/stream" element={<Stream />} />
          <Route path="/admindashboard/line" element={<Line />} />
          <Route path="/admindashboard/faq" element={<FAQ />} />
          <Route path="/admindashboard/geography" element={<Geography />} />
          <Route path="/admindashboard/viewfeedback" element={<ViewFeedback />} />
        </Route>
        
      </Routes>
    </Router>
  );
};

export default AppRouter;
