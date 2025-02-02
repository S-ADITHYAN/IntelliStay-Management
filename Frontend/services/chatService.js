import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const API_BASE_URL = import.meta.env.VITE_API || 'http://localhost:3001';

// Function to handle API calls with error checking
const fetchApi = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
};

// Function to fetch real-time hotel data
const fetchHotelData = async () => {
  try {
    const [rooms, restaurant, facilities, packages] = await Promise.all([
      fetchApi('/rooms'),
      fetchApi('/restaurant'),
      fetchApi('/facility'),
      fetchApi('/package')
    ]);

    if (!rooms || !restaurant || !facilities || !packages) {
      throw new Error('Failed to fetch complete hotel data');
    }

    return {
      rooms,
      restaurant,
      facilities,
      packages
    };
  } catch (error) {
    console.error('Error fetching hotel data:', error);
    throw new Error('Failed to fetch hotel information');
  }
};

// Generate dynamic system prompt based on real-time data
const generateSystemPrompt = async () => {
  try {
    const hotelData = await fetchHotelData();
    console.log("hotelData",hotelData)
    return `IntelliBot AI assistant. Here's our current information:

ROOMS:
${hotelData.rooms.map(room => `
- ${room.roomtype}: ₹${room.rate}/night,
  ${room.description},
  Allowed Adults: ${room.allowedAdults},
  Allowed Children: ${room.allowedChildren},
  Amenities: ${room.amenities},
  Status: ${room.status ? '✅ available' : '❌ Fully Booked'}
`).join('\n')}

RESTAURANT:
- ${hotelData.restaurant.name}
- Hours: ${hotelData.restaurant.hours}
- Current Status: ${hotelData.restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
- Special of the day: ${hotelData.restaurant.specialOfDay}
- Wait Time: ${hotelData.restaurant.currentWaitTime}

MENU HIGHLIGHTS:
${hotelData.restaurant.menu.map(category => `
${category.categoryName}:
${category.items.map(item => `- ${item.name} (${item.price})`).join('\n')}
`).join('\n')}

FACILITIES:
${hotelData.facilities.map(facility => `
- ${facility.name}
  Hours: ${facility.operatingHours.open} - ${facility.operatingHours.close}
  Status: ${facility.status}
`).join('\n')}

CURRENT PACKAGES:
${hotelData.packages.map(pkg => `
- ${pkg.name}: ${pkg.price.currency}${pkg.price.amount}
  ${pkg.description}
  ${pkg.availability ? '✅ Available' : '❌ Sold Out'}
`).join('\n')}

Instructions:
1. Provide concise, accurate information about our services
2. For room bookings, check availability before suggesting
3. For restaurant queries, mention current wait times
4. Always include relevant pricing information
5. Suggest suitable packages based on guest needs
6. For unavailable services, offer alternatives
7. Add relevant emojis to make responses engaging

Remember to:
- Keep responses brief (2-3 sentences)
- Be polite and professional
- Guide users to reception for complex queries
- Mention current promotions when relevant`;
  } catch (error) {
    console.error('Error generating system prompt:', error);
    return null;
  }
};

const formatResponse = (text, contextData) => {
  // Format restaurant and menu information
  if (text.includes('menu') || text.includes('food') || text.includes('restaurant')) {
    const menuByCategory = {};
    contextData?.menu?.forEach(category => {
      menuByCategory[category.categoryName] = category.items.map(item => ({
        name: item.name,
        price: item.price,
        description: item.description,
        isVegetarian: item.isVegetarian,
        spiceLevel: item.spiceLevel || 'Medium',
        preparationTime: item.preparationTime || '20-30 mins'
      }));
    });

    return {
      type: 'bot',
      content: text,
      formattedData: {
        restaurantInfo: [
          `🏪 ${contextData?.name || 'IntelliStay Restaurant'}`,
          `⏰ Hours: ${contextData?.hours || '7:00 AM - 11:00 PM'}`,
          `⌛ Current Wait: ${contextData?.currentWaitTime || '15'} minutes`,
          `👨‍🍳 Special: ${contextData?.specialOfDay || 'Chef\'s Special Butter Chicken'}`
        ],
        menu: Object.entries(menuByCategory).map(([category, items]) => ({
          category,
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            description: item.description,
            badges: [
              item.isVegetarian ? '🌱 Veg' : '🍖 Non-Veg',
              `🌶️ ${item.spiceLevel}`,
              `⏱️ ${item.preparationTime}`
            ]
          }))
        }))
      },
      options: [
        { text: 'Reserve Table', icon: '🪑' },
        { text: 'Special Offers', icon: '🎉' },
        { text: 'Contact Restaurant', icon: '📞' }
      ]
    };
  }

  // Format room information
  if (text.includes('room') || text.includes('accommodation')) {
    return {
      type: 'bot',
      content: text,
      formattedData: contextData?.rooms?.map(room => ({
        title: room.roomtype,
        points: [
          `💰 Price: ₹${room.rate}/night`,
          `🛏️ Features: ${room.description}`,
          `✨ Status: ${room.status ? 'available' : 'Fully Booked'}`,
          `Allowed Adults: ${room.allowedAdults}`,
          `Allowed Children: ${room.allowedChildren}`,
          `Amenities: ${room.amenities}`
        ]
      }))
    };
  }

  // Format facility information
  if (text.includes('facility') || text.includes('amenities')) {
    return {
      type: 'bot',
      content: text,
        formattedData: contextData?.facilities?.map(facility => ({
        title: facility.name,
        points: [
          `⏰ Hours: ${facility.operatingHours.open} - ${facility.operatingHours.close}`,
          `📍 Status: ${facility.status}`,
          `💰 ${facility.pricing.rate > 0 ? `Rate: ₹${facility.pricing.rate} ${facility.pricing.unit}` : 'Complimentary'}`,
          `📝 ${facility.description}`
        ]
      }))
    };
  }

  // Format package information
  if (text.includes('package') || text.includes('deal')) {
    return {
      type: 'bot',
      content: text,
      formattedData: contextData?.packages?.map(pkg => ({
        title: pkg.name,
        points: [
          `💰 Price: ₹${pkg.price.amount}`,
          `📅 Duration: ${pkg.duration.days} days, ${pkg.duration.nights} nights`,
          `✨ Status: ${pkg.availability ? 'Available' : 'Sold Out'}`,
          pkg.discount ? `🎉 Special Offer: ${pkg.discount.percentage}% off` : '',
          `📝 ${pkg.description}`,
          `✅ Inclusions: ${pkg.inclusions.map(inc => inc.item).join(', ')}`
        ].filter(Boolean)
      }))
    };
  }

  return {
    type: 'bot',
    content: text
  };
};

export const generateResponse = async (userMessage) => {
  try {
    const systemPrompt = await generateSystemPrompt();
    if (!systemPrompt) {
      throw new Error('Failed to initialize chat system');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Initialize as IntelliStay's AI assistant." }]
        },
        {
          role: "model",
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    });

    const contextData = await getQuerySpecificData(userMessage);
    const result = await chat.sendMessage([{ text: userMessage }]);
    const response = await result.response;
    const text = response.text();

    // Format the response with context data
    const formattedResponse = formatResponse(text, contextData);
    
    // Add dynamic options
    const options = await getDynamicOptions(userMessage, contextData);
    if (options.length > 0) {
      formattedResponse.options = options;
    }

    return formattedResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      type: 'bot',
      content: "I apologize, but I'm having trouble accessing the information right now. Please try again in a moment.",
      options: [
        { text: 'Contact Reception', icon: '📞' },
        { text: 'Try Again', icon: '🔄' }
      ]
    };
  }
};

// Get query-specific data
const getQuerySpecificData = async (userMessage) => {
  const message = userMessage.toLowerCase();
  
  try {
    if (message.includes('menu') || message.includes('food') || message.includes('restaurant')) {
      const restaurant = await fetchApi('/restaurant');
      const menu = await fetchApi('/menu');
      return {
        ...restaurant,
        menu: menu
      };
    }
    if (message.includes('room') || message.includes('book')) {
      return await fetchApi('/rooms');
    }
    if (message.includes('facility') || message.includes('gym') || message.includes('pool')) {
      return await fetchApi('/facility');
    }
    if (message.includes('package') || message.includes('deal') || message.includes('offer')) {
      return await fetchApi('/package');
    }
    return null;
  } catch (error) {
    console.error('Error fetching specific data:', error);
    return null;
  }
};

// Generate dynamic options based on user query
const getDynamicOptions = async (userMessage, contextData) => {
  const message = userMessage.toLowerCase();
  const defaultOptions = [
    { text: 'View Rooms', icon: '🏨' },
    { text: 'Restaurant Menu', icon: '🍽️' },
    { text: 'Our Facilities', icon: '🏊' },
    { text: 'Special Packages', icon: '🎁' }
  ];

  if (!contextData) return defaultOptions;

  // Custom options based on query context
  if (message.includes('room') || message.includes('book')) {
    return [
      { text: 'Check Availability', icon: '📅' },
      { text: 'View Room Types', icon: '🛏️' },
      { text: 'Room Rates', icon: '💰' },
      { text: 'Book Now', icon: '✅' }
    ];
  }

  if (message.includes('menu') || message.includes('food') || message.includes('restaurant')) {
    return [
      { text: 'View Full Menu', icon: '📖' },
      { text: 'Reserve Table', icon: '🪑' },
      { text: 'Today\'s Special', icon: '👨‍🍳' },
      { text: 'Contact Restaurant', icon: '📞' }
    ];
  }

  return defaultOptions;
};