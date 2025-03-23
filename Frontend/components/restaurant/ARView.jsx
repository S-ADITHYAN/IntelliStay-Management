import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaCamera, FaPlus, FaArrowLeft, FaArrowRight, FaMinus, FaCube } from 'react-icons/fa';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ARStyles.css';
import Swal from 'sweetalert2';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import { Button } from '@mui/material';

const ARView = ({ item, onClose, menuItems = [] }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelsRef = useRef([]);
  const dragRef = useRef({
    isDragging: false,
    selectedModel: null,
    plane: new THREE.Plane(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    intersection: new THREE.Vector3()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arItems, setArItems] = useState([{
    ...item,
    position: { x: 0, y: 0, z: -2 },
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 }
  }]);
  const [availableItems, setAvailableItems] = useState(
    menuItems.filter(menuItem => menuItem.id !== item.id) || []
  );
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Add this new ref for device orientation
  const deviceOrientationRef = useRef(null);

  // Add device detection state
  const [isMobile] = useState(() => {
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  });

  // Add loadModel function before the useEffect
  const loadModel = (item, index) => {
    const loader = new GLTFLoader();
    
    // Determine which model to load
    const modelPath = item.model3D || '/models/pizza.glb';
    console.log('Loading model from:', modelPath); // Debug log

    loader.load(
      modelPath,
      async (gltf) => {
        const model = gltf.scene;
        const container = new THREE.Group();
        
        // Set initial position
        model.position.set(0, 0, 0);
        container.position.set(
          item.position.x,
          item.position.y,
          item.position.z
        );
        container.scale.setScalar(item.scale);
        
        container.add(model);
        
        // Detect ingredients when loading the model
        if (item.image) {
          await detectIngredientsInImage(item.image, item.name);
        }
        
        const label = await createLabel(item.name, model, item);
        if (label) {
          container.add(label);
        }
        
        if (sceneRef.current) {
          if (modelsRef.current[index]) {
            sceneRef.current.remove(modelsRef.current[index]);
          }
          sceneRef.current.add(container);
          modelsRef.current[index] = container;
          
          const updateLabel = () => {
            if (label && cameraRef.current) {
              label.lookAt(cameraRef.current.position);
            }
          };
          
          const animate = () => {
            requestAnimationFrame(animate);
            updateLabel();
          };
          animate();
        }
      },
      // Add loading progress callback
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      // Add error handling callback
      (error) => {
        console.error('Error loading model:', error);
        // If the custom model fails to load, try loading the default pizza model
        if (modelPath !== '/models/pizza.glb') {
          console.log('Falling back to default pizza model');
          loadModel({ ...item, model3D: '/models/pizza.glb' }, index);
        }
      }
    );
  };

  // Define handleDeviceMotion at component level
  const handleDeviceMotion = (event) => {
    if (!cameraRef.current) return;
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    
    // Update camera position
    if (Math.abs(acceleration.z) > 0.5) {
      cameraRef.current.position.z += acceleration.z * 0.005;
      cameraRef.current.position.z = THREE.MathUtils.clamp(
        cameraRef.current.position.z,
        1,
        10
      );
      
      // Update all models' scale based on camera distance
      modelsRef.current.forEach((container, index) => {
        if (container) {
          const distance = cameraRef.current.position.distanceTo(container.position);
          const scale = 1 + (1 / distance);
          container.scale.setScalar(scale * arItems[index].scale);
        }
      });
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    const initScene = () => {
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75, // field of view
        window.innerWidth / window.innerHeight,
        0.1, // near plane (reduced to allow closer viewing)
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Add OrbitControls with enhanced configuration
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;  // Increased minimum distance to prevent getting too close
      controls.maxDistance = 10;
      controls.enablePan = true;
      controls.panSpeed = 0.5;
      controls.rotateSpeed = 0.5;
      controls.enableZoom = true; // Enable zoom for testing on desktop
      controlsRef.current = controls;

      // Add renderer to container
      if (containerRef.current) {
        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '2';
        containerRef.current.appendChild(canvas);
      }

      // Load initial model
      loadModel(arItems[0], 0);

      // Handle window resize
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }

        renderer.render(scene, camera);
      };
      animate();

      // Add event listeners to the renderer's canvas
      const canvas = renderer.domElement;
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      
      // Add touch events for mobile
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
      canvas.addEventListener('touchcancel', handleTouchEnd);

      // Add device motion handling
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('devicemotion', handleDeviceMotion);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
        controls.dispose();
      };
    };

    initScene();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) { 
          sceneRef.current.remove(sceneRef.current.children[0]); 
        }
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        videoRef.current = video;
        if (containerRef.current) {
          containerRef.current.appendChild(video);
        }

        // Simple mobile detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Camera constraints
        const constraints = {
          video: isMobile ? 
            { facingMode: { exact: 'environment' } } : // Mobile back camera
            { width: { ideal: 1920 }, height: { ideal: 1080 } } // Desktop camera
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve);
          };
        });

        setIsLoading(false);

      } catch (err) {
        console.error('Camera error:', err);
        
        // Show user-friendly error message
        Swal.fire({
          icon: 'error',
          title: 'Camera Access Required',
          html: `
            <div>
              <p>Please allow camera access to use AR view.</p>
              <p style="margin-top: 10px"><strong>Quick Fix:</strong></p>
              <ol style="text-align: left; margin-top: 10px">
                <li>Click the camera icon in your address bar</li>
                <li>Select "Allow" for camera access</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          `,
          confirmButtonText: 'Try Again',
          showCancelButton: true,
          cancelButtonText: 'Close'
        }).then((result) => {
          if (result.isConfirmed) {
            initCamera();
          } else {
            onClose();
          }
        });
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  // Add a retry button in the error UI
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initCamera();
  };

  // Update the addItemToAR function to better position new items
  const addItemToAR = (menuItem) => {
    // Calculate position in a grid layout (2x2, 2x3, etc.)
    const itemCount = arItems.length;
    const spacing = 2; // Space between items
    const row = Math.floor(itemCount / 2);
    const col = itemCount % 2;
    
    const newItem = {
        ...menuItem, 
        position: { 
        x: col * spacing - spacing/2, // Arrange in columns
        y: 0,
        z: -2 - (row * spacing)      // Arrange in rows, moving back
      },
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 }
    };

    setArItems(prev => [...prev, newItem]);
    setAvailableItems(prev => prev.filter(item => item.id !== menuItem.id));
    setShowItemSelector(false);
    
    // Load the new model
    loadModel(newItem, arItems.length);
  };
  console.log(arItems[0].image)
  // Add this function to handle Cloudinary URLs
  const getFullResolutionImage = (cloudinaryUrl) => {
    // Remove any existing transformation parameters
    return cloudinaryUrl.split('/upload/').join('/upload/q_auto,f_auto/');
  };

  // Update the IngredientsPanel component
  const IngredientsPanel = ({ ingredients }) => (
    <div style={{
      position: 'fixed',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderRadius: '15px',
      padding: '20px',
      color: 'white',
      width: '300px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#4CAF50',
        fontSize: '24px',
        borderBottom: '2px solid #4CAF50',
        paddingBottom: '10px',
        textAlign: 'center'
      }}>Ingredients Detected from Model</h3>
      
      {ingredients && ingredients.length > 0 ? (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {ingredients.map((ingredient, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              fontSize: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                marginRight: '12px',
                flexShrink: 0
              }}></span>
              {ingredient.name}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ 
          color: '#999', 
          margin: 0,
          textAlign: 'center',
          fontSize: '16px'
        }}>Detecting ingredients...</p>
      )}
    </div>
  );

  // Add state for storing detected ingredients
  const [detectedIngredients, setDetectedIngredients] = useState([]);

  // Modify the detectIngredientsInImage function
  const detectIngredientsInImage = async (imageUrl, itemName) => {
    try {
      console.log('Starting Gemini ingredient detection for:', itemName);
      console.log('Image URL:', imageUrl);

      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();

      const prompt = `detect ingredients used in the food from the image. 
      Format each ingredient with an asterisk (*) at the start of the line.`;
      const imagePart = {
        inlineData: {
          data: await blobToBase64(imageBlob),
          mimeType: "image/jpeg"
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response_text = await result.response.text();
      
      console.log('Gemini Detection Results:', response_text);

      const ingredients = parseGeminiResponse(response_text);
      setDetectedIngredients(ingredients); // Update the state with detected ingredients
      
      return ingredients;

    } catch (error) {
      console.error('Ingredient detection error:', error);
      setDetectedIngredients([]); // Clear ingredients on error
      return [];
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Update the parseGeminiResponse function
  const parseGeminiResponse = (response) => {
    const ingredients = [];
    
    try {
      // Extract ingredients from the response
      const lines = response.split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('*')) {
          const ingredient = line.trim().substring(1).trim();
          if (ingredient) {
            ingredients.push({
              name: ingredient,
              confidence: 95 // High confidence since these are directly detected
            });
          }
        }
      });
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
    }

    return ingredients;
  };

  // Modify the createLabel function to remove ingredients section
  const createLabel = async (text, model, item) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 300; // Reduced height since we're not showing ingredients here

    // Create background with rounded corners and gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    context.fillStyle = gradient;
    roundRect(context, 0, 0, canvas.width, canvas.height, 20);
    context.fill();

    // Add a subtle border
    context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    context.lineWidth = 2;
    roundRect(context, 0, 0, canvas.width, canvas.height, 20);
    context.stroke();

    // Style for the text
    context.textAlign = 'left';
    context.textBaseline = 'top';

    // Item name with decorative underline
    context.font = 'bold 32px Arial';
    context.fillStyle = '#ffffff';
    const titleY = 20;
    context.fillText(text, 20, titleY);
    
    // Add decorative underline
    context.beginPath();
    context.moveTo(20, titleY + 40);
    context.lineTo(canvas.width - 20, titleY + 40);
    context.strokeStyle = '#4CAF50';
    context.lineWidth = 2;
    context.stroke();

    try {
      // Only show nutritional information in the label
      let yOffset = 80;

      // Display nutritional information
      context.font = 'bold 24px Arial';
      context.fillStyle = '#4CAF50';
      context.fillText('Nutritional Information:', 20, yOffset);
      yOffset += 35;

      // Fetch and display nutritional info
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await aiModel.generateContent([
        `For ${text}, provide only the following nutritional information in this exact format:
        Calories: [number]
        Protein: [number]g
        Carbs: [number]g
        Fat: [number]g
        Allergens: [list]`
      ]);

      const response = await result.response;
      const nutritionInfo = await response.text();

      context.font = '22px Arial';
      context.fillStyle = '#ffffff';
      const nutritionLines = nutritionInfo.split('\n');
      nutritionLines.forEach(line => {
        if (line.trim()) {
          context.fillText(line.trim(), 20, yOffset);
          yOffset += 30;
        }
      });

    } catch (error) {
      console.error('Error in createLabel:', error);
      context.font = '24px Arial';
      context.fillStyle = '#ff6b6b';
      context.fillText('Error loading information', 20, 100);
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95
    });
    const sprite = new THREE.Sprite(material);

    // Position the label above the model
    const modelBox = new THREE.Box3().setFromObject(model);
    const modelHeight = modelBox.max.y - modelBox.min.y;
    sprite.position.set(0, modelHeight + 1, 0);
    sprite.scale.set(2.5, 2, 1);

    return sprite;
  };

  // Add this helper function for rounded rectangles
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Scale selected item
  const scaleItem = (factor) => {
    if (modelsRef.current[selectedItemIndex]) {
      const currentScale = modelsRef.current[selectedItemIndex].scale.x;
      const newScale = Math.max(0.5, Math.min(3, currentScale * factor));
      modelsRef.current[selectedItemIndex].scale.setScalar(newScale);

    setArItems(prev => {
      const newItems = [...prev];
      newItems[selectedItemIndex] = {
          ...newItems[selectedItemIndex],
          scale: newScale
      };
      return newItems;
    });
    }
  };

  // Update the handleMouseDown function to work with the container
  const handleMouseDown = (event) => {
    event.preventDefault();
    
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    dragRef.current.mouse.set(x, y);
    dragRef.current.raycaster.setFromCamera(dragRef.current.mouse, cameraRef.current);
    
    // Check intersection with models (now checking the entire container)
    const intersects = dragRef.current.raycaster.intersectObjects(
      modelsRef.current.filter(Boolean),
      true
    );
    
    if (intersects.length > 0) {
      // Find the container (parent) of the clicked object
      let container = intersects[0].object;
      while (container.parent && !modelsRef.current.includes(container)) {
        container = container.parent;
      }
      
      // Disable OrbitControls while dragging
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      
      dragRef.current.isDragging = true;
      dragRef.current.selectedModel = container;
      
      // Set up the drag plane parallel to the camera
      const cameraDirection = new THREE.Vector3();
      cameraRef.current.getWorldDirection(cameraDirection);
      dragRef.current.plane.setFromNormalAndCoplanarPoint(
        cameraDirection,
        container.position
      );
    }
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current.isDragging || !dragRef.current.selectedModel) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    dragRef.current.mouse.set(x, y);
    dragRef.current.raycaster.setFromCamera(dragRef.current.mouse, cameraRef.current);
    
    // Calculate intersection with drag plane
    if (dragRef.current.raycaster.ray.intersectPlane(
      dragRef.current.plane,
      dragRef.current.intersection
    )) {
      // Move the model to the new position
      dragRef.current.selectedModel.position.copy(dragRef.current.intersection);
      
      // Update arItems state with the new position
      const modelIndex = modelsRef.current.indexOf(dragRef.current.selectedModel);
      if (modelIndex !== -1) {
        setArItems(prev => {
          const newItems = [...prev];
          newItems[modelIndex] = {
            ...newItems[modelIndex],
            position: {
              x: dragRef.current.intersection.x,
              y: dragRef.current.intersection.y,
              z: dragRef.current.intersection.z
            }
          };
      return newItems;
    });
      }
    }
  };
  
  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.selectedModel = null;
    
    // Re-enable OrbitControls after dragging
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  };

  const handleTouchStart = (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    handleMouseDown({ 
      preventDefault: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: event.target
    });
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    handleMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: event.target
    });
  };
  
  const handleTouchEnd = handleMouseUp;
  
  // Update the selectModel function to handle the container
  const selectModel = (modelIndex) => {
    setSelectedItemIndex(modelIndex);
    
    // Highlight the selected model
    modelsRef.current.forEach((container, index) => {
      if (container) {
        // Find the actual model in the container (first child)
        const model = container.children[0];
        model.traverse((child) => {
          if (child.isMesh) {
            child.material.emissive = new THREE.Color(
              index === modelIndex ? 0x555555 : 0x000000
            );
          }
        });
      }
    });
  };
  
  // Update the requestDeviceMotionPermission function to use the handleDeviceMotion from component scope
  const requestDeviceMotionPermission = async () => {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      } else {
        // For devices that don't require permission
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
    }
  };

  // Call this function when component mounts
  useEffect(() => {
    requestDeviceMotionPermission();
    
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  // Add this function to check if there are multiple items
  const hasMultipleItems = () => {
    return menuItems.length > 1;
  };

  // Update the FloatingMenu component to show nutritional information
  const FloatingMenu = () => (
    <div className="ar-floating-menu" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      maxWidth: '90%',
      width: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      zIndex: 1001
    }}>
      <div className="ar-menu-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Add More Items to View</h3>
        <button 
          onClick={() => setShowItemSelector(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="ar-menu-items" style={{
        display: 'grid',
        gap: '15px'
      }}>
        {availableItems.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '10px'
          }}>
            All items have been added to the AR view
          </div>
        ) : (
          availableItems.map(menuItem => (
            <div 
              key={menuItem.id} 
              className="ar-menu-item"
              onClick={() => addItemToAR(menuItem)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <img
                  src={menuItem.image || '/images/default-food.png'} 
                  alt={menuItem.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginRight: '15px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>{menuItem.name}</div>
                  <div style={{
                    color: '#4CAF50',
                    fontWeight: '600'
                  }}>₹{menuItem.price.toFixed(2)}</div>
                </div>
                <FaPlus style={{
                  color: '#2196F3',
                  marginLeft: '10px'
                }} />
              </div>
              
              {/* Nutrition Information */}
              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '8px',
                marginTop: '5px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div style={{ color: '#666' }}>
                    <span style={{ fontWeight: '500' }}>Calories:</span> {menuItem.calories || 'N/A'}
                  </div>
                  <div style={{ color: '#666' }}>
                    <span style={{ fontWeight: '500' }}>Protein:</span> {menuItem.protein || 'N/A'}g
                  </div>
                  <div style={{ color: '#666' }}>
                    <span style={{ fontWeight: '500' }}>Carbs:</span> {menuItem.carbs || 'N/A'}g
                  </div>
                  <div style={{ color: '#666' }}>
                    <span style={{ fontWeight: '500' }}>Fat:</span> {menuItem.fat || 'N/A'}g
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  useEffect(() => {
    console.log('Available items:', availableItems);
    console.log('Menu items:', menuItems);
  }, [availableItems, menuItems]);

  const handlePreviewAR = (item) => {
    // Implementation of handlePreviewAR function
  };

  return (
    <div className="ar-view-container">
      <button className="ar-close-btn" onClick={onClose}>
        <FaTimes />
      </button>
      
      <div className="ar-scene-container" ref={containerRef}>
        <canvas className="ar-canvas"></canvas>
      </div>
      
      {isLoading && (
        <div className="ar-loading-overlay">
          <div className="ar-spinner"></div>
          <p>Initializing AR view...</p>
        </div>
      )}
      
      {error && (
        <div className="ar-error">
          <p>{error}</p>
          <div className="ar-error-buttons">
            <button onClick={handleRetry} className="retry-btn">
              Try Again
            </button>
            <button onClick={onClose} className="close-btn">
              Close AR View
            </button>
          </div>
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          {/* Add More Items Button */}
          {hasMultipleItems() && availableItems.length > 0 && (
            <button 
              onClick={() => setShowItemSelector(!showItemSelector)}
              style={{
                position: 'fixed',
                bottom: '160px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2196F3',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '500',
                zIndex: 1000,
                width: 'auto',
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              <FaPlus /> Add More Items ({availableItems.length} available)
            </button>
          )}

          {/* Scale controls */}
          <div className="ar-controls">
            <div className="ar-item-controls">
              <button className="ar-control-btn" onClick={() => scaleItem(1.2)}>
                <FaPlus />
              </button>
              <button className="ar-control-btn" onClick={() => scaleItem(0.8)}>
                <FaMinus />
              </button>
            </div>
          </div>
          
          {showItemSelector && <FloatingMenu />}

          {/* Add the ingredients panel */}
          {detectedIngredients.length > 0 && (
            <IngredientsPanel ingredients={detectedIngredients} />
          )}
        </>
      )}
      
      <div className="ar-instructions">
        <p>Move device closer or further to zoom</p>
        <p>Tap and drag to move items</p>
        <p>Use two fingers to rotate view</p>
        <p>Use + and - buttons to adjust base size</p>
        {hasMultipleItems() && availableItems.length > 0 && (
          <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            Tap the green + button to add more items
          </p>
        )}
      </div>

      <Button
        onClick={() => handlePreviewAR(item)}
        startIcon={<FaCube />}
        variant="contained"
        color="primary"
        size="small"
        title={item.model3D ? 'View custom 3D model' : 'View default pizza model'}
      >
        {item.model3D ? 'Preview Custom AR' : 'Preview Default AR'}
      </Button>
    </div>
  );
};

export default ARView; 