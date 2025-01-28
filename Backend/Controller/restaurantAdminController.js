const { MenuItem, Table, Order, TableReservation } = require('../models/RestaurantModel');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary storage for menu items
const menuImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'restaurant_menu',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }]
  }
});

const uploadMenuImage = multer({ storage: menuImageStorage });


exports.Adminlogin= (req, res) => {
  const { emailsign, passwordsign } = req.body;
 
          if (emailsign==='admin@example.com' ) {
              if (passwordsign==='admin123') {
                
                  const token = jwt.sign({email:'admin@example.com',role:'resadmin'}, process.env.JWT_SECRET_KEY);
                  res.status(200).json({message:"success",token: token});
                  
              } else {
                  res.json("the password is incorrect");
              }
          } else {
              res.json("No user found :(");
          }
      
      
};

// Menu Item Management
exports.addMenuItem = [
  uploadMenuImage.single('image'),
  async (req, res) => {
    try {
      const { name, description, price, category, preparationTime, specialTags } = req.body;
      const imageUrl = req.file ? req.file.path : null;

      const menuItem = new MenuItem({
        name,
        description,
        price,
        category,
        image: imageUrl,
        preparationTime,
        specialTags: specialTags ? JSON.parse(specialTags) : []
      });

      await menuItem.save();
      res.status(201).json({ message: 'Menu item added successfully', menuItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

// Table Management
exports.addTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location } = req.body;
    const table = new Table({
      tableNumber,
      capacity,
      location
    });
    await table.save();
    res.status(201).json({ message: 'Table added successfully', table });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Order Management
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 