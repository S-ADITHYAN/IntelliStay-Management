import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import json
import matplotlib.pyplot as plt

def predict_food_image(image_path):
    # Load the model
    print("Loading model...")
    model = tf.keras.models.load_model('food_model_final.keras')
    
    # Load category mappings
    print("Loading category mappings...")
    with open('category_mappings.json', 'r') as f:
        category_info = json.load(f)
    
    # Load and preprocess the image
    print(f"Loading image from: {image_path}")
    img = load_img(image_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, 0)
    img_array = img_array / 255.0
    
    # Make prediction
    print("Making prediction...")
    predictions = model.predict(img_array, verbose=0)
    
    # Get top 3 predictions
    top_3_idx = np.argsort(predictions[0])[-3:][::-1]
    
    # Display image with predictions
    plt.figure(figsize=(10, 6))
    
    # Show image
    plt.subplot(1, 2, 1)
    plt.imshow(img)
    plt.axis('off')
    plt.title('Input Image')
    
    # Show predictions
    plt.subplot(1, 2, 2)
    plt.axis('off')
    plt.title('Top 3 Predictions')
    
    results_text = ""
    for i, idx in enumerate(top_3_idx):
        confidence = predictions[0][idx]
        # Find class name
        class_name = "Unknown"
        for cat_id, cat_idx in category_info['categories'].items():
            if cat_idx == idx:
                class_name = category_info['category_names'][cat_id]
                break
        
        results_text += f"{i+1}. {class_name}: {confidence:.2%}\n"
        print(f"{i+1}. {class_name}: {confidence:.2%}")
    
    plt.text(0.1, 0.5, results_text, fontsize=12, verticalalignment='center')
    
    # Save and show results
    plt.tight_layout()
    plt.savefig('prediction_result.png')
    plt.show()

# Test the image
image_path = r"C:\Users\rohit\Downloads\chicken.jpg"
predict_food_image(image_path) 