const Restaurant = require('../models/Restaurant');
const Facility = require('../models/Facility');
const Package = require('../models/Package');

const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      Restaurant.deleteMany({}),
      Facility.deleteMany({}),
      Package.deleteMany({})
    ]);

    // Restaurant Data
    const restaurant = await Restaurant.create({
      name: "IntelliStay Restaurant",
      isOpen: true,
      hours: "7:00 AM - 11:00 PM",
      specialOfDay: "Chef's Special Butter Chicken",
      currentWaitTime: "15 minutes",
      
    });

    // Facilities Data
    const facilities = await Facility.create([
      {
        name: "Infinity Pool",
        type: "Pool",
        operatingHours: {
          open: "06:00",
          close: "22:00",
          weekendHours: {
            open: "06:00",
            close: "23:00"
          }
        },
        status: "Available",
        currentCapacity: {
          current: 10,
          maximum: 50
        },
        description: "Rooftop infinity pool with city views",
        amenities: ["Towels Provided", "Loungers", "Pool Bar", "Changing Rooms"],
        pricing: {
          rate: 0,
          unit: "free"
        },
        bookingRequired: false,
        image: "pool.jpg"
      },
      {
        name: "Fitness Center",
        type: "Gym",
        operatingHours: {
          open: "05:00",
          close: "22:00",
          weekendHours: {
            open: "06:00",
            close: "22:00"
          }
        },
        status: "Available",
        currentCapacity: {
          current: 8,
          maximum: 25
        },
        description: "Modern gym with cardio and weight training equipment",
        amenities: ["Personal Trainer", "Towels", "Water Dispenser", "Changing Rooms"],
        pricing: {
          rate: 0,
          unit: "free"
        },
        bookingRequired: false,
        image: "gym.jpg"
      },
      {
        name: "Serenity Spa",
        type: "Spa",
        operatingHours: {
          open: "10:00",
          close: "20:00",
          weekendHours: {
            open: "09:00",
            close: "21:00"
          }
        },
        status: "Available",
        currentCapacity: {
          current: 3,
          maximum: 10
        },
        description: "Luxury spa offering various treatments",
        amenities: ["Steam Room", "Sauna", "Massage", "Facial Treatments"],
        pricing: {
          rate: 2000,
          unit: "per session"
        },
        bookingRequired: true,
        image: "spa.jpg"
      }
    ]);

    // Packages Data
    const packages = await Package.create([
      {
        name: "Romantic Getaway",
        type: "Honeymoon",
        price: {
          amount: 15000,
          currency: "₹"
        },
        description: "Perfect package for honeymooners",
        inclusions: [
          {
            item: "Luxury Room",
            details: "3 days 2 nights stay"
          },
          {
            item: "Couples Spa",
            details: "60-minute massage"
          },
          {
            item: "Romantic Dinner",
            details: "Candlelight dinner at rooftop"
          }
        ],
        duration: {
          days: 3,
          nights: 2
        },
        validityPeriod: {
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
        },
        availability: true,
        maxGuests: 2,
        terms: [
          "Advance booking required",
          "Subject to availability",
          "Non-refundable"
        ],
        image: "honeymoon-package.jpg",
        discount: {
          percentage: 15,
          validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      },
      {
        name: "Business Executive",
        type: "Business",
        price: {
          amount: 8000,
          currency: "₹"
        },
        description: "Perfect for business travelers",
        inclusions: [
          {
            item: "Executive Room",
            details: "Per night"
          },
          {
            item: "Meeting Room",
            details: "4 hours complimentary"
          },
          {
            item: "Airport Transfer",
            details: "Two-way"
          }
        ],
        duration: {
          days: 1,
          nights: 1
        },
        validityPeriod: {
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 6))
        },
        availability: true,
        maxGuests: 1,
        terms: [
          "24-hour check-in",
          "Free cancellation 24 hours before",
          "Subject to availability"
        ],
        image: "business-package.jpg",
        discount: {
          percentage: 10,
          validUntil: new Date(new Date().setMonth(new Date().getMonth() + 2))
        }
      }
    ]);

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData; 