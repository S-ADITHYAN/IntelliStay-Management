import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSearch, FaShoppingCart, FaLeaf, FaInfoCircle, FaTimes, FaGlobeAmericas, FaListUl, FaHeartbeat, FaExclamationTriangle, FaSpinner, FaCamera, FaCube } from 'react-icons/fa';
import { GiMeat, GiCookingPot } from 'react-icons/gi';
import { MdRestaurantMenu } from 'react-icons/md';
import './MenuDisplay.css';
import Header from '../../components/Header';
import Swal from 'sweetalert2';
import {jwtDecode}from 'jwt-decode';
import Footer from '../../components/footer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ARView from './ARView';
import { processImageForAR } from '../../utils/arUtils';
import './ARStyles.css';

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
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageSearchError, setImageSearchError] = useState(null);
  const fileInputRef = useRef(null);
  const [showAR, setShowAR] = useState(false);
  const [selectedARItem, setSelectedARItem] = useState(null);
  const [isProcessingAR, setIsProcessingAR] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  const imageInputRef = useRef(null);

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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

      try {
        const result = await model.generateContent({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        });

        const response = await result.response;
        const text = response.text();
        
        // Clean the response text
        const cleanText = text
          .replace(/```json\s*|\s*```/g, '') // Remove markdown code blocks
          .replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace
        
        try {
          return JSON.parse(cleanText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          throw new Error('Failed to parse AI response as JSON');
        }
      } catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          console.log('Falling back to gemini-pro');
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          const fallbackResult = await fallbackModel.generateContent({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          });
          
          const fallbackResponse = await fallbackResult.response;
          const fallbackText = fallbackResponse.text()
            .replace(/```json\s*|\s*```/g, '')
            .replace(/^\s+|\s+$/g, '');
          
          return JSON.parse(fallbackText);
        }
        throw error;
      }
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  };

  const getDishInfo = async (dishName) => {
    setIsInfoLoading(true);
    setSelectedDishName(dishName);
    try {
      const prompt = `Generate a JSON object with detailed culinary information about "${dishName}". Return ONLY the JSON object with no additional text or formatting. The JSON structure should be:
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
        footer: import.meta.env.DEV ? error.message : null
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

  const handleImageSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImageSearching(true);
    setImageSearchError(null);
    setSearchTerm('');

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      
      // Update to use gemini-1.5-pro-vision-latest
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision-latest" });

      const base64Image = await fileToBase64(file);

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      };

      try {
        // Try with Gemini 1.5
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const identifiedFood = response.text().trim();
        
        // Process the result...
        const matchingItems = menuItems.filter(item => 
          item.name.toLowerCase().includes(identifiedFood.toLowerCase()) ||
          item.description.toLowerCase().includes(identifiedFood.toLowerCase())
        );

        if (matchingItems.length === 0) {
          setImageSearchError('No matching menu items found');
        } else {
          setSearchTerm(identifiedFood);
        }
      } catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          // Fallback to gemini-pro-vision if 1.5 is not available
          console.log('Falling back to gemini-pro-vision');
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
          const fallbackResult = await fallbackModel.generateContent([prompt, imagePart]);
          const fallbackResponse = await fallbackResult.response;
          const identifiedFood = fallbackResponse.text().trim();
          
          // Process the fallback result...
          const matchingItems = menuItems.filter(item => 
            item.name.toLowerCase().includes(identifiedFood.toLowerCase()) ||
            item.description.toLowerCase().includes(identifiedFood.toLowerCase())
          );

          if (matchingItems.length === 0) {
            setImageSearchError('No matching menu items found');
          } else {
            setSearchTerm(identifiedFood);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Image search error:', error);
      setImageSearchError('Failed to process image search. Please try again.');
    } finally {
      setIsImageSearching(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleViewInAR = async (item) => {
    // Ensure we have a valid image URL
    if (!item.image) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Show in AR',
        text: 'This item does not have an image available.',
        showConfirmButton: true,
        position: 'center'
      });
      return;
    }

    setIsProcessingAR(true);
    
    try {
      // For testing, we'll use the pizza.glb model
      const modelPath = '/models/pizza.glb';
      
      // In a production app, you might want to map food items to specific models
      // const modelPath = getModelPathForItem(item.name);
      
      // Set the selected item for AR view with the model path
      setSelectedARItem({...item, modelPath});
      setShowAR(true);
    } catch (error) {
      console.error('Error preparing AR view:', error);
      Swal.fire({
        icon: 'error',
        title: 'AR View Failed',
        text: 'Could not initialize AR view. Please try again.',
        showConfirmButton: true,
        position: 'center'
      });
    } finally {
      setIsProcessingAR(false);
    }
  };

  const handleFoodRecognition = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsRecognizing(true);
    setRecognitionError(null);
    setSearchTerm('');

    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(
            `${import.meta.env.VITE_API}/api/image-recognition/recognize-food`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.data.success) {
            // Extract only the part before the comma
            const recognizedFood = response.data.category.split(',')[0].trim();
            
            // Filter menu items based on recognized food
            const matchingItems = menuItems.filter(menuItem => 
                menuItem.name.toLowerCase().includes(recognizedFood.toLowerCase()) ||
                menuItem.description.toLowerCase().includes(recognizedFood.toLowerCase())
            );
            
            console.log("Recognized food:", recognizedFood);
            console.log("Matching items found:", matchingItems.length);
            
            if (matchingItems.length === 0) {
                setRecognitionError('No matching menu items found');
            } else {
                setSearchTerm(recognizedFood);
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Food Recognized!',
                    text: `Looks like ${recognizedFood}. Showing matching items...`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else {
            throw new Error('Recognition failed');
        }
    } catch (error) {
        console.error('Food recognition error:', error);
        setRecognitionError('Failed to recognize food. Please try again.');
        
        Swal.fire({
            icon: 'error',
            title: 'Recognition Failed',
            text: 'Unable to recognize the food in the image. Please try again.',
            showConfirmButton: true
        });
    } finally {
        setIsRecognizing(false);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
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
            <div className="search-bar-container">
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="image-recognition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFoodRecognition}
                  className="hidden"
                  ref={imageInputRef}
                  id="imageRecognitionInput"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="image-recognition-btn"
                  disabled={isRecognizing}
                  title="Recognize food from image"
                >
                  {isRecognizing ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCamera />
                  )}
                </button>
              </div>
            </div>

            {recognitionError && (
              <div className="text-red-500 text-sm mt-2">
                {recognitionError}
              </div>
            )}

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
                      {item.foodtype === 'Veg' ? (
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
                      <div className="item-actions">
                        <button 
                          onClick={() => getDishInfo(item.name)}
                          className="info-btn"
                          disabled={isInfoLoading}
                        >
                          {isInfoLoading ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaInfoCircle />
                          )}
                        </button>
                        <button 
                          onClick={() => handleViewInAR(item)}
                          className="ar-btn"
                          disabled={isProcessingAR}
                        >
                          {isProcessingAR ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaCube />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="item-description">{item.description}</p>
                    <div className="item-footer">
                      <span className="price">₹{item.price.toFixed(2)}</span>
                      {token && (
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="add-to-cart-btn"
                          id="add"
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

      {/* AR View Overlay */}
      {showAR && selectedARItem && (
        <ARView
          item={selectedARItem}
          onClose={() => {
            setShowAR(false);
            setSelectedARItem(null);
          }}
        />
      )}
    </div>
  );
};

export default MenuDisplay;