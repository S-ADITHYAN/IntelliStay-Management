import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaShoppingCart, FaLeaf, FaInfoCircle, FaTimes, FaGlobeAmericas, FaListUl, FaHeartbeat, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { GiMeat, GiCookingPot } from 'react-icons/gi';
import { MdRestaurantMenu } from 'react-icons/md';
import './MenuDisplay.css';
import Header from '../../components/Header';
import Swal from 'sweetalert2';
import {jwtDecode}from 'jwt-decode';
import Footer from '../../components/footer';
import { GoogleGenerativeAI } from "@google/generative-ai";

const MenuDisplay = ({ addToCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const [dishInfo, setDishInfo] = useState(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [selectedDishName, setSelectedDishName] = useState(null);

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

  const generateContent = async (prompt, apiKey) => {
    try {
      // Initialize the Generative AI
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Get the generative model (gemini-pro)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Update the prompt to ensure clean JSON response
      const structuredPrompt = `${prompt} 
      Important: Respond with ONLY the JSON object, no markdown formatting, no backticks, no explanations.`;

      // Generate content
      const result = await model.generateContent(structuredPrompt);
      const response = await result.response;
      let text = response.text();

      // Clean the response text
      // Remove any markdown formatting or extra characters
      text = text.replace(/```json\s*|\s*```/g, '')  // Remove markdown code blocks
               .replace(/^[\s\n]+|[\s\n]+$/g, '');   // Remove leading/trailing whitespace

      // Parse the JSON response
      try {
        // Validate JSON structure before parsing
        if (!text.startsWith('{') || !text.endsWith('}')) {
          throw new Error('Response is not in valid JSON format');
        }
        
        const parsedData = JSON.parse(text);
        
        // Validate required fields
        if (!parsedData.origin || !parsedData.ingredients || !parsedData.nutrition) {
          throw new Error('Response missing required fields');
        }

        return parsedData;
      } catch (parseError) {
        console.error('Raw response:', text);
        console.error('Parse error:', parseError);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  };

  const getDishInfo = async (dishName) => {
    setIsInfoLoading(true);
    setSelectedDishName(dishName);
    try {
      const prompt = `Provide detailed culinary information about "${dishName}" in the following JSON structure:
      {
        "origin": {
          "country": "country name",
          "region": "region name",
          "history": "brief history"
        },
        "ingredients": {
          "mainIngredients": ["ingredient1", "ingredient2"],
          "spicesAndHerbs": ["spice1", "spice2"],
          "alternatives": ["alt1", "alt2"]
        },
        "nutrition": {
          "calories": "number per serving",
          "protein": "grams per serving",
          "carbs": "grams per serving",
          "fats": "grams per serving",
          "vitamins": ["vitamin1", "vitamin2"],
          "minerals": ["mineral1", "mineral2"]
        },
        "dietaryInfo": {
          "isVegetarian": true or false,
          "isVegan": true or false,
          "isGlutenFree": true or false,
          "allergens": ["allergen1", "allergen2"]
        }
      }`;

      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const result = await generateContent(prompt, GEMINI_API_KEY);
      setDishInfo(result);
    } catch (error) {
      console.error('Error fetching dish information:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Fetching Information',
        text: 'Unable to get dish information at this time. Please try again later.',
        footer: import.meta.env.DEV ? error.message : null // Show error details only in development
      });
    } finally {
      setIsInfoLoading(false);
    }
  };

  const handleClosePopup = () => {
    setDishInfo(null);
    setSelectedDishName(null);
  };

  const InfoPopup = ({ info, onClose, dishName }) => {
    if (!info) return null;

    return (
      <div className="dish-info-popup">
        <div className="popup-content">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>

          <div className="text-center mb-6 popup-header">
            <MdRestaurantMenu className="mx-auto text-4xl text-orange-500 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{dishName}</h1>
            <h2 className="text-xl font-semibold text-gray-700">Dish Information</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center mb-6">
              <MdRestaurantMenu className="mx-auto text-4xl text-orange-500 mb-2" />
              <h2 className="text-3xl font-bold text-gray-800">Dish Information</h2>
            </div>

            <section className="info-section section-origin">
              <div className="section-header">
                <FaGlobeAmericas className="section-icon text-blue-500" />
                <h3>Origin & History</h3>
              </div>
              <div className="ml-7">
                <p className="text-gray-700">
                  <span className="font-medium">Country:</span> {info.origin.country}<br/>
                  <span className="font-medium">Region:</span> {info.origin.region}<br/>
                  <span className="font-medium">History:</span> {info.origin.history}
                </p>
              </div>
            </section>

            <section className="info-section section-ingredients">
              <div className="section-header">
                <FaListUl className="section-icon text-green-500" />
                <h3>Ingredients</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 ml-7">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Main Ingredients:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {info.ingredients.mainIngredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Spices & Herbs:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {info.ingredients.spicesAndHerbs.map((spice, idx) => (
                      <li key={idx}>{spice}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="info-section section-nutrition">
              <div className="section-header">
                <FaHeartbeat className="section-icon text-purple-500" />
                <h3>Nutrition Facts</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6 ml-7">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">Calories:</span> {info.nutrition.calories}</p>
                    <p className="text-gray-700"><span className="font-medium">Protein:</span> {info.nutrition.protein}</p>
                    <p className="text-gray-700"><span className="font-medium">Carbs:</span> {info.nutrition.carbs}</p>
                    <p className="text-gray-700"><span className="font-medium">Fats:</span> {info.nutrition.fats}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Vitamins & Minerals:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {info.nutrition.vitamins.map((vitamin, idx) => (
                      <li key={idx}>{vitamin}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="info-section section-dietary">
              <div className="section-header">
                <GiCookingPot className="section-icon text-yellow-600" />
                <h3>Dietary Information</h3>
              </div>
              <div className="ml-7">
                <div className="flex flex-wrap gap-3 mb-3">
                  {info.dietaryInfo.isVegetarian && (
                    <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <FaLeaf /> Vegetarian
                    </span>
                  )}
                  {info.dietaryInfo.isVegan && (
                    <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <FaLeaf /> Vegan
                    </span>
                  )}
                  {info.dietaryInfo.isGlutenFree && (
                    <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <GiMeat /> Gluten Free
                    </span>
                  )}
                </div>
                {info.dietaryInfo.allergens.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <FaExclamationTriangle />
                      <h4 className="font-medium">Allergens:</h4>
                    </div>
                    <p className="text-gray-700">{info.dietaryInfo.allergens.join(', ')}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
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
                      <button 
                        onClick={() => getDishInfo(item.name)}
                        className="info-btn"
                        disabled={isInfoLoading}
                      >
                        {isInfoLoading ? (
                          <FaSpinner className="animate-spin text-blue-500" size={20} />
                        ) : (
                          <FaInfoCircle 
                            className="text-gray-600 hover:text-blue-500 transition-colors" 
                            size={20}
                          />
                        )}
                      </button>
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
      <div className='footer'>
      <Footer/>
    </div>

      {dishInfo && (
        <InfoPopup 
          info={dishInfo} 
          onClose={handleClosePopup}
          dishName={selectedDishName}
        />
      )}
    </div>
  );
};

export default MenuDisplay;