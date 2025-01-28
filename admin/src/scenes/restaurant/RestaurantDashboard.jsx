import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaClipboardList, FaCalendarAlt, FaChair } from 'react-icons/fa';
import { Header } from "../../components";
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const managementCards = [
    {
      title: 'Menu Management',
      description: 'Add, edit, and manage menu items, categories, and pricing',
      icon: <FaUtensils />,
      path: '/admindashboard/restaurant/menu',
      color: '#4CAF50'
    },
    {
      title: 'Order Management',
      description: 'Track and manage customer orders, update order status',
      icon: <FaClipboardList />,
      path: '/admindashboard/restaurant/orders',
      color: '#2196F3'
    },
    {
      title: 'Reservation Management',
      description: 'Handle table reservations and booking requests',
      icon: <FaCalendarAlt />,
      path: '/admindashboard/restaurant/reservations',
      color: '#FF9800'
    },
    {
      title: 'Table Management',
      description: 'Manage restaurant tables, seating, and availability',
      icon: <FaChair />,
      path: '/admindashboard/restaurant/tables',
      color: '#9C27B0'
    }
  ];

  return (
    <div className="restaurant-admin">
      <div className="admin-header">
      <Header title="Restaurant" subtitle="Manage your restaurant operations efficiently" />
      </div>

      <div className="management-cards">
        {managementCards.map((card, index) => (
          <Link to={card.path} key={index} className="card-link">
            <div className="management-card" style={{ '--card-color': card.color }}>
              <div className="card-icon" style={{ backgroundColor: card.color }}>
                {card.icon}
              </div>
              <div className="card-content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RestaurantDashboard;