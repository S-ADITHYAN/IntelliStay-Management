const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer();

router.post('/recognize-food', upload.single('image'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post('http://localhost:5001/predict', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log("response", response.data)

        res.json(response.data);
    } catch (error) {
        console.error('Error in food recognition:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process image'
        });
    }
});

module.exports = router; 