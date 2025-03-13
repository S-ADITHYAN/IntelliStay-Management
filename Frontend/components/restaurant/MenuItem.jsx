import React from 'react';
import { FaCube, FaShoppingCart } from 'react-icons/fa';
import './MenuItem.css';

const MenuItem = ({ item, onViewInAR, addToCart }) => {
  return (
    <div className="menu-item">
      <div className="menu-item-image">
        <img 
          src={item.image || '/images/default-food.png'} 
          alt={item.name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default-food.png';
          }}
        />
      </div>
      
      <div className="menu-item-content">
        <h3 className="menu-item-name">{item.name}</h3>
        <p className="menu-item-price">₹{item.price.toFixed(2)}</p>
        <p className="menu-item-description">{item.description}</p>
        
        <div className="menu-item-actions">
          <button 
            className="view-ar-btn" 
            onClick={onViewInAR}
            title="View in AR"
          >
            <FaCube /> View in your space
          </button>
          
          <button 
            className="add-to-cart-btn" 
            onClick={() => addToCart && addToCart(item)}
            title="Add to cart"
          >
            <FaShoppingCart /> Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItem; 