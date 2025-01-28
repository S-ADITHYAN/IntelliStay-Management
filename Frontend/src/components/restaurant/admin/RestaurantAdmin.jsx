import React from 'react';
import { Outlet } from 'react-router-dom';

const RestaurantAdmin = () => {
    return (
        <div className="admin-dashboard">
            <h1>Restaurant Administration</h1>
            <Outlet />
        </div>
    );
};

export default RestaurantAdmin; 