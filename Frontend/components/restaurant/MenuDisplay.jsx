import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaShoppingCart, FaLeaf } from 'react-icons/fa';
import { GiMeat } from 'react-icons/gi';
import './MenuDisplay.css';
import Header from '../../components/Header';
import Swal from 'sweetalert2';
import {jwtDecode}from 'jwt-decode';
import Footer from '../../components/footer';

const MenuDisplay = ({ addToCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const menuResponse = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/menuitems`);
        setMenuItems(Array.isArray(menuResponse.data) ? menuResponse.data : []);
        console.log("menuResponse",menuResponse.data)

        const categoryResponse = await axios.get(`${import.meta.env.VITE_API}/user/restaurant/categoriess`);
        setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data : []);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load menu data. Please try again later.');
        setMenuItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = Array.isArray(menuItems) ? menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const decoded = jwtDecode(token);
      return decoded._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const handleAddToCart = async (item) => {
    try {
      const userId = getUserIdFromToken();
      
      if (!userId) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please login to add items to cart',
          showConfirmButton: true,
          position: 'center'
        });
        return;
      }

      const cartItem = {
        itemTitle: item.name,
        image: item.image,
        rating: item.rating || 5,
        price: item.price,
        quantity: 1,
        subTotal: item.price,
        menuItemId: item._id,
        availableQuantity: item.availableQuantity || 100,
        userId: userId,
        specialInstructions: ''
      };

    

      const response = await axios.post(
        `${import.meta.env.VITE_API}/user/restaurant/cart/add`,
        cartItem,
        
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart!',
          text: `${item.name} has been added to your cart`,
          showConfirmButton: false,
          timer: 2500,
          position: 'top-end',
          toast: true,
          background: '#4caf50',
          color: '#fff',
          customClass: {
            popup: 'colored-toast'
          }
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.response?.data?.message || 'Failed to add item to cart',
        showConfirmButton: true,
        position: 'center',
        background: '#fff',
        confirmButtonColor: '#4caf50'
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className='menunav'>
        <Header title="Guest Information" subtitle="Fill in guest details" />
      </div>
      
      {/* Login Prompt Banner - Show only when not logged in */}
      {!token && (
        <div className="login-prompt-banner">
          <div className="banner-content">
            <FaShoppingCart className="banner-icon" />
            <p>Please <a href="/signup">login</a> to add items to your cart</p>
          </div>
        </div>
      )}

      <div className="menu-display">
        <div className="menu-banner">
          <div className="banner-overlay">
            <h1>Our Menu</h1>
            <p>Discover our delicious offerings</p>
          </div>
        </div>

        <div className="menu-container">
          <div className="search-filter-section">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-filter">
              <button
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={selectedCategory === category ? 'active' : ''}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-items-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div key={item._id} className="menu-item">
                  <div className="item-image-wrapper">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="menu-image"
                      onError={(e) => {
                        e.target.src = '/default-food-image.jpg';
                      }}
                    />
                    <div className="food-type-indicator">
                      {item.foodtype === 'veg' ? (
                        <div className="veg-icon">
                          <FaLeaf style={{ color: 'green' }} />
                        </div>
                      ) : (
                        <div className="non-veg-icon">
                          <GiMeat style={{ color: 'red' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-content">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                    </div>
                    <p className="item-description">{item.description}</p>
                    <div className="item-footer">
                      <span className="price">₹{item.price.toFixed(2)}</span>
                      {token && (
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="add-to-cart-btn"
                        >
                          <FaShoppingCart /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-items-message">
                <p>No menu items found. Please try a different search or category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDisplay;