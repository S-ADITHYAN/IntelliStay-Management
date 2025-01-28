const botResponses = {
  greetings: [
    "Hello! How can I assist you today?",
    "Hi there! Welcome to IntelliStay. What can I help you with?",
    "Welcome! How may I help you?"
  ],
  
  roomBooking: {
    info: "You can book rooms through our website. Would you like to know about:",
    options: ["Room Types", "Pricing", "Booking Process", "Cancellation Policy"]
  },

  roomTypes: {
    response: "We offer several room types:\n- Standard Room\n- Deluxe Room\n- Suite\n- Family Room",
    options: ["View Room Prices", "Book Now", "More Details"]
  },

  restaurant: {
    info: "Our restaurant offers both dining-in and takeaway options. What would you like to know?",
    options: ["Menu", "Table Reservation", "Opening Hours", "Special Offers"]
  },

  tableReservation: {
    response: "You can reserve a table through our website or by calling us. Would you like to:",
    options: ["Book Online Now", "View Available Times", "Contact Us"]
  },

  facilities: {
    response: "Our facilities include:\n- Swimming Pool\n- Gym\n- Spa\n- Conference Rooms\n- Parking",
    options: ["More Details", "Operating Hours", "Booking Info"]
  },

  contact: {
    response: "You can reach us through:\nPhone: +1 234 567 8900\nEmail: intellistay@info.com\nAddress: 123 Hotel Street, City",
    options: ["Send Email", "Get Directions", "Call Now"]
  },

  default: {
    response: "I'm not sure I understand. Could you please choose from these options?",
    options: ["Room Booking", "Restaurant", "Facilities", "Contact Us"]
  }
};

export const getBotResponse = async (userMessage) => {
  const message = userMessage.toLowerCase();
  
  // Add response logic based on user input
  if (message.includes('room') || message.includes('book')) {
    return {
      type: 'bot',
      content: botResponses.roomBooking.info,
      options: botResponses.roomBooking.options
    };
  }
  
  if (message.includes('restaurant') || message.includes('food') || message.includes('eat')) {
    return {
      type: 'bot',
      content: botResponses.restaurant.info,
      options: botResponses.restaurant.options
    };
  }

  if (message.includes('table') || message.includes('reservation')) {
    return {
      type: 'bot',
      content: botResponses.tableReservation.response,
      options: botResponses.tableReservation.options
    };
  }

  if (message.includes('facility') || message.includes('amenities')) {
    return {
      type: 'bot',
      content: botResponses.facilities.response,
      options: botResponses.facilities.options
    };
  }

  if (message.includes('contact') || message.includes('phone') || message.includes('email')) {
    return {
      type: 'bot',
      content: botResponses.contact.response,
      options: botResponses.contact.options
    };
  }

  // Default response if no match is found
  return {
    type: 'bot',
    content: botResponses.default.response,
    options: botResponses.default.options
  };
}; 