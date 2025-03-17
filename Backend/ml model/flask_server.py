from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import json
import os
from PIL import Image
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the model and category mappings
model = load_model('food_model_final.keras')

with open('category_mappings.json', 'r') as f:
    category_mappings = json.load(f)

# Reverse the category mappings for prediction
reverse_mappings = {v: k for k, v in category_mappings['categories'].items()}

def preprocess_image(img):
    # Resize image to match model's expected sizing
    img = img.resize((224, 224))  # Adjust size according to your model's requirements
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("predict")
        # Get image from request
        file = request.files['image']
        img = Image.open(io.BytesIO(file.read()))
        
        # Preprocess the image
        processed_img = preprocess_image(img)
        
        # Make prediction
        predictions = model.predict(processed_img)
        predicted_class = np.argmax(predictions[0])
        
        # Get category name
        category_id = reverse_mappings[predicted_class]
        category_name = category_mappings['category_names'][category_id]
        
        # Get confidence score
        confidence = float(predictions[0][predicted_class])
        print("category_name", category_name)
        return jsonify({
            'success': True,
            'category': category_name,
            'confidence': confidence
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5001) 