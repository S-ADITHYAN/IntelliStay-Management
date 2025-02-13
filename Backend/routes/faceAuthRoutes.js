const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

// Save face data
router.post('/save-face', auth, upload.single('image'), async (req, res) => {
  try {
    const { userId, faceDescriptor } = req.body;
    
    await User.findByIdAndUpdate(userId, {
      faceDescriptor,
      hasFaceEnabled: true
    });

    res.status(200).json({ message: 'Face data saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving face data' });
  }
});

// Get face auth status
router.get('/face-auth-status/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({ hasFaceEnabled: user.hasFaceEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Error getting face auth status' });
  }
});

// Disable face login
router.delete('/disable-face/:userId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      faceDescriptor: null,
      hasFaceEnabled: false
    });
    res.json({ message: 'Face login disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling face login' });
  }
});

// Verify face for login
router.post('/verify-face', upload.single('image'), async (req, res) => {
  try {
    const { faceDescriptor, email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.faceDescriptor) {
      return res.status(401).json({ message: 'Face login not enabled' });
    }

    // Compare face descriptors
    const distance = euclideanDistance(
      Float32Array.from(faceDescriptor),
      Float32Array.from(user.faceDescriptor)
    );

    if (distance < 0.6) { // Threshold for face match
      // Generate and return JWT token
      const token = user.generateAuthToken();
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Face verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying face' });
  }
});

// Helper function to calculate euclidean distance
function euclideanDistance(desc1, desc2) {
  return Math.sqrt(
    desc1
      .map((x, i) => Math.pow(x - desc2[i], 2))
      .reduce((sum, curr) => sum + curr, 0)
  );
}

module.exports = router;