import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
// import AdminRoute from './AdminRoute';

// User Components
import MenuDisplay from '../../components/restaurant/MenuDisplay';
import CartManagement from '../../components/restaurant/CartManagement';
import OrderCheckout from '../../components/restaurant/OrderCheckout';
import OrderHistory from '../../components/restaurant/OrderHistory';
import TableReservation from '../../components/restaurant/TableReservation';
import MyTableReservation from '../../components/restaurant/MyTableReservation';
import ARView from '../../components/restaurant/ARView';

// Admin Components
// import RestaurantDashboard from '../../components/restaurant/admin/RestaurantDashboard';
// import MenuManagement from '../../components/restaurant/admin/MenuManagement';
// import TableManagement from '../../components/restaurant/admin/TableManagement';
// import OrderManagement from '../../components/restaurant/admin/OrderManagement';
// import ReservationManagement from '../../components/restaurant/admin/ReservationManagement';

const RestaurantRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="menu" element={<MenuDisplay />} />
      <Route path="ar-view" element={<ARView />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="reservations" element={<TableReservation />} />
        <Route path="table-reservations" element={<MyTableReservation />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="cart" element={<CartManagement />} />
      </Route>

      {/* Admin Routes */}
      {/* <Route element={<AdminRoute />}>
        <Route path="admin" element={<RestaurantDashboard />}>
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="reservations" element={<ReservationManagement />} />
        </Route>
      </Route> */}
    </Routes>
  );
};

export default RestaurantRoutes; 