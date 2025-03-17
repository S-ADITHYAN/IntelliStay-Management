import os
import json
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from tqdm import tqdm
import tensorflow as tf
from tensorflow.keras import layers, models, applications
from tensorflow.keras.preprocessing.image import img_to_array, load_img

class FoodDataset:
    def __init__(self, root_dir, annotations_file):
        self.root_dir = root_dir
        
        # Load annotations
        try:
            with open(annotations_file, 'r') as f:
                annotations = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Annotations file not found at {annotations_file}")
        
        # Create category mappings
        self.categories = {cat['id']: idx for idx, cat in enumerate(annotations['categories'])}
        self.category_names = {cat['id']: cat['name_readable'] for cat in annotations['categories']}
        self.num_classes = len(self.categories)
        
        # Get image paths and labels
        self.image_paths = []
        self.labels = []
        
        # Create annotation mapping for faster lookup
        image_to_category = {}
        for ann in annotations['annotations']:
            image_to_category[ann['image_id']] = ann['category_id']
        
        # Build dataset
        for image in tqdm(annotations['images'], desc="Loading dataset"):
            img_id = image['id']
            if img_id in image_to_category:
                img_path = os.path.join(root_dir, 'images', image['file_name'])
                if os.path.exists(img_path):
                    self.image_paths.append(img_path)
                    self.labels.append(self.categories[image_to_category[img_id]])
        
        print(f"Found {len(self.image_paths)} valid images out of {len(annotations['images'])} total images")
        
        if len(self.image_paths) == 0:
            raise RuntimeError(f"No valid images found in {root_dir}")

    def create_tf_dataset(self, batch_size=32, is_training=True):
        """Create a TensorFlow dataset from the image paths and labels"""
        # Define preprocessing function
        def preprocess_image(path, label):
            # Read image
            img = tf.io.read_file(path)
            img = tf.image.decode_jpeg(img, channels=3)
            img = tf.image.resize(img, [224, 224])
            img = tf.cast(img, tf.float32) / 255.0
            
            # Data augmentation for training
            if is_training:
                img = tf.image.random_flip_left_right(img)
                img = tf.image.random_brightness(img, 0.1)
                img = tf.image.random_contrast(img, 0.8, 1.2)
            
            return img, label
        
        # Create dataset
        dataset = tf.data.Dataset.from_tensor_slices((self.image_paths, self.labels))
        
        # Shuffle if training
        if is_training:
            dataset = dataset.shuffle(buffer_size=min(10000, len(self.image_paths)))
        
        # Apply preprocessing
        dataset = dataset.map(preprocess_image, 
                             num_parallel_calls=tf.data.AUTOTUNE)
        
        # Batch and prefetch
        dataset = dataset.batch(batch_size)
        dataset = dataset.prefetch(tf.data.AUTOTUNE)
        
        return dataset

def create_model(num_classes):
    """Create a more efficient model using MobileNetV2"""
    # Use a smaller, faster model
    base_model = applications.MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    # Freeze the base model
    base_model.trainable = False
    
    # Create new model
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile model with a higher learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Print model summary
    model.summary()
    
    return model

def main():
    # Define base directory
    base_dir = r"C:\Users\rohit\Downloads\archive"
    print(f"Base directory: {base_dir}")
    
    # Define paths
    train_dir = os.path.join(base_dir, 'raw_data', 'public_training_set_release_2.0')
    val_dir = os.path.join(base_dir, 'raw_data', 'public_validation_set_2.0')
    train_annotations = os.path.join(base_dir, 'raw_data', 'public_training_set_release_2.0', 'annotations.json')
    val_annotations = os.path.join(base_dir, 'raw_data', 'public_validation_set_2.0', 'annotations.json')
    
    # Print paths for verification
    print("\nUsing paths:")
    print(f"Training directory: {train_dir}")
    print(f"Training annotations: {train_annotations}")
    print(f"Validation directory: {val_dir}")
    print(f"Validation annotations: {val_annotations}")
    
    # Verify paths exist
    for path in [train_dir, val_dir, train_annotations, val_annotations]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path not found: {path}")
    
    # Create datasets
    try:
        print("\nLoading training dataset...")
        train_dataset = FoodDataset(train_dir, train_annotations)
        
        print("\nLoading validation dataset...")
        val_dataset = FoodDataset(val_dir, val_annotations)
        
        print(f"\nTraining dataset size: {len(train_dataset.image_paths)}")
        print(f"Validation dataset size: {len(val_dataset.image_paths)}")
        print(f"Number of categories: {train_dataset.num_classes}")
        
        # Create TF datasets - use smaller batch size if memory is an issue
        train_data = train_dataset.create_tf_dataset(batch_size=16, is_training=True)
        val_data = val_dataset.create_tf_dataset(batch_size=16, is_training=False)
        
    except Exception as e:
        print(f"Error loading datasets: {str(e)}")
        raise
    
    # Create callbacks
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            'best_model.keras',
            save_best_only=True,
            monitor='val_accuracy'
        ),
        tf.keras.callbacks.EarlyStopping(
            patience=3,
            monitor='val_accuracy',
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            factor=0.5,
            patience=2,
            monitor='val_accuracy',
            min_lr=1e-6
        ),
        # Add TensorBoard for monitoring
        tf.keras.callbacks.TensorBoard(
            log_dir='./logs',
            update_freq='epoch'
        )
    ]
    
    # Create and train model - use MobileNetV2 instead of ResNet50 for faster training
    model = create_model(train_dataset.num_classes)
    
    # Train model with fewer epochs initially
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=5,  # Start with fewer epochs
        callbacks=callbacks,
        verbose=1
    )
    
    # Plot results
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training')
    plt.plot(history.history['val_loss'], label='Validation')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Training')
    plt.plot(history.history['val_accuracy'], label='Validation')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_results.png')
    
    # Save the final model in .keras format
    model.save('food_model_final.keras', save_format='keras')
    
    # Save category mappings
    category_info = {
        'categories': {str(k): v for k, v in train_dataset.categories.items()},
        'category_names': {str(k): v for k, v in train_dataset.category_names.items()}
    }
    with open('category_mappings.json', 'w') as f:
        json.dump(category_info, f)

    print("\nModel saved as 'food_model_final.keras'")
    print("Category mappings saved as 'category_mappings.json'")

def predict_image(image_path):
    """Function to predict a single image"""
    # Load the model
    model = tf.keras.models.load_model('food_model_final.keras')
    
    # Load category mappings
    with open('category_mappings.json', 'r') as f:
        category_info = json.load(f)
    
    # Load and preprocess image
    img = load_img(image_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, 0)
    img_array = img_array / 255.0
    
    # Get prediction
    predictions = model.predict(img_array)
    predicted_class = np.argmax(predictions[0])
    confidence = predictions[0][predicted_class]
    
    # Get class name
    for cat_id, idx in category_info['categories'].items():
        if idx == predicted_class:
            return category_info['category_names'][cat_id], confidence
    
    return "Unknown", 0.0

if __name__ == '__main__':
    main() 