#!/bin/bash
# Start Flask server
cd "ml model"
python flask_server.py &

# Start Node.js server

# Install required Python packages
pip install flask flask-cors tensorflow pillow numpy 

cd ..
npm start 
