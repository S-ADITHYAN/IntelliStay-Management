import * as THREE from 'three';

/**
 * Utility functions for AR functionality
 */

/**
 * Process an image for AR use
 * @param {string} imageUrl - URL of the image to process
 * @returns {Promise<Object>} - Processed image data
 */
export const processImageForAR = async (imageUrl) => {
  try {
    // In a real application, you might want to:
    // 1. Resize the image to an appropriate size
    // 2. Convert to a format suitable for AR
    // 3. Extract features for tracking
    
    // For now, we'll just return the original URL
    return {
      success: true,
      processedUrl: imageUrl,
      width: 512,  // Default width
      height: 512, // Default height
    };
  } catch (error) {
    console.error('Error processing image for AR:', error);
    throw new Error('Failed to process image for AR view');
  }
};

/**
 * Get the appropriate 3D model path for a food item
 * @param {string} itemName - Name of the food item
 * @returns {string} - Path to the 3D model
 */
export const getModelPathForItem = (itemName) => {
  // This is a simple mapping function that could be expanded
  // In a real app, you might have a database of models
  const itemNameLower = itemName.toLowerCase();
  
  if (itemNameLower.includes('pizza')) {
    return '/models/pizza.glb';
  } else if (itemNameLower.includes('burger')) {
    return '/models/burger.glb';
  } else if (itemNameLower.includes('pasta')) {
    return '/models/pasta.glb';
  } else if (itemNameLower.includes('cake')) {
    return '/models/cake.glb';
  } else if (itemNameLower.includes('biriyani') || itemNameLower.includes('biryani')) {
    return '/models/pizza.glb'; // Use pizza as fallback for now
  }
  
  // Default to pizza model for testing
  return '/models/pizza.glb';
};

/**
 * Calculate the optimal position for a 3D model in AR space
 * @param {Object} dimensions - Dimensions of the model
 * @returns {Object} - Position coordinates
 */
export const calculateARPosition = (dimensions) => {
  // In a real AR application, this would use more sophisticated
  // positioning based on the device's camera and environment
  
  return {
    x: 0,
    y: 0,
    z: -3, // 3 units in front of the camera
  };
};

/**
 * Create environment lighting for realistic rendering
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} - References to created lights
 */
export const createRealisticLighting = (scene) => {
  // Main directional light (sun-like)
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 10, 7);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  scene.add(mainLight);
  
  // Ambient light for general illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Fill light from opposite direction
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -7);
  scene.add(fillLight);
  
  // Subtle rim light for edge highlighting
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
  rimLight.position.set(0, -10, -5);
  scene.add(rimLight);
  
  return {
    mainLight,
    ambientLight,
    fillLight,
    rimLight
  };
};

/**
 * Detect device capabilities for AR
 * @returns {Object} - Device capability information
 */
export const detectDeviceCapabilities = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasGyroscope = 'DeviceOrientationEvent' in window;
  const hasWebGL = (function() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
      return false;
    }
  })();
  
  return {
    isMobile,
    hasGyroscope,
    hasWebGL,
    browserName: getBrowserName(),
    isARCapable: hasWebGL && (isMobile || hasGyroscope)
  };
};

/**
 * Get browser name
 * @returns {string} - Browser name
 */
const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  let browserName;
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  } else {
    browserName = "Unknown";
  }
  
  return browserName;
}; 