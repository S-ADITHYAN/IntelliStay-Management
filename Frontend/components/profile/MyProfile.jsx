import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  useTheme,
  IconButton,
  FormHelperText
} from "@mui/material";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Swal from 'sweetalert2';
import Header from "../Header";
import './MyProfile.css'
import useAuth from "../../src/useAuth";
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const MyProfile = () => {
  useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const theme = useTheme();
  const [userData, setUserData] = useState({_id:""});
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    address: "",
    image: "",
    role: "",
    phone_no: "",
    dob: ""
  });
  const [errors, setErrors] = useState({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isFaceModelLoading, setIsFaceModelLoading] = useState(true);
  const [hasFaceEnabled, setHasFaceEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchProfileData = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/user/profile/${userId}`);
      const data = response.data;
      setProfileData({
        displayName: data.displayName || "",
        email: data.email || "",
        address: data.address || "",
        image: data.image || "",
        role: data.role || "",
        phone_no: data.phone_no || "",
        dob: data.dob || ""
      });
      setIsGoogleUser(!!data.googleId);
      setHasFaceEnabled(data.hasFaceEnabled);
       // Set to true if googleId exists
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      Swal.fire("Error", "Failed to fetch profile data", "error");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserData(decodedToken);
        fetchProfileData(decodedToken?._id);
      } catch (error) {
        console.error("Failed to decode token:", error);
        Swal.fire("Error", "Failed to authenticate", "error");
      }
    }
  }, [fetchProfileData]);

  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        setIsFaceModelLoading(true);
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsFaceModelLoading(false);
      } catch (error) {
        console.error('Error loading face models:', error);
        Swal.fire({
          title: 'Model Loading Error',
          text: 'Failed to load face detection models. Please refresh the page.',
          icon: 'error'
        });
      }
    };

    loadFaceModels();
  }, []);

  const handleUpdateClick = () => {
    setEditMode(true);
  };

  const validateInput = (name, value) => {
    let error = "";
    switch (name) {
      case "displayName":
        if (!/^[a-zA-Z\s._]+$/.test(value)) {
          error = "Only letters, spaces, dots, and underscores are allowed";
        }
        break;
      case "phone_no":
        if (!/^\d{10}$/.test(value)) {
          error = "Phone number must be 10 digits";
        } else if (/(\d)\1{3,}/.test(value)) {
          error = "No more than 3 consecutive repeated digits allowed";
        }
        break;
      case "dob":
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          error = "Must be at least 18 years old";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateInput(name, value);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = () => {
    const newErrors = {};
    Object.keys(profileData).forEach(key => {
      const error = validateInput(key, profileData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    axios.post(`${import.meta.env.VITE_API}/user/profile/update/${userData._id}`, profileData)
      .then(response => {
        Swal.fire("Success", "Profile updated successfully", "success");
        setEditMode(false);
      })
      .catch(error => {
        Swal.fire("Error", "Error updating profile data", "error");
      });
  };

  const handlePasswordChange = () => {
    setChangePasswordMode(true);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$/;
    return regex.test(password);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Validate new password
    if (name === 'newPassword') {
      if (!validatePassword(value)) {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          newPassword: 'Password must be 6-50 characters long, include a letter, a number, and a special character'
        }));
      } else {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          newPassword: ''
        }));
      }
    }

    // Validate confirm password
    if (name === 'confirmPassword') {
      if (value !== passwordData.newPassword) {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setPasswordErrors(prevErrors => ({
          ...prevErrors,
          confirmPassword: ''
        }));
      }
    }
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prevErrors => ({
        ...prevErrors,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    if (!validatePassword(passwordData.newPassword)) {
      setPasswordErrors(prevErrors => ({
        ...prevErrors,
        newPassword: 'Password must be 6-50 characters long, include a letter, a number, and a special character'
      }));
      return;
    }

    axios.put(`${import.meta.env.VITE_API}/user/change-password/${userData._id}`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
    .then(response => {
      Swal.fire("Success", "Password changed successfully", "success");
      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    })
    .catch(error => {
      Swal.fire("Error", "Current password is incorrect or error updating password", "error");
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  
    const formData = new FormData();
    formData.append("image", file);
  
    axios.post(`${import.meta.env.VITE_API}/user/upload-photo/${userData._id}`, formData)
      .then(response => {
        Swal.fire("Success", "Profile image updated successfully", "success");
        setProfileData(prevData => ({
          ...prevData,
          image: response.data.image
        }));
      })
      .catch(error => {
        Swal.fire("Error", "Error uploading image", "error");
      });
  };

  const handleFaceCapture = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);

      // Show clearer instructions first
      const { value: willProceed } = await Swal.fire({
        title: 'Face ID Setup Instructions',
        html: `
          <div class="face-setup-instructions">
            <p>Please follow these steps:</p>
            <ol>
              <li>Center your face in the frame</li>
              <li>Blink naturally 2-3 times</li>
              <li>Slowly turn your head left and right (about 15 degrees)</li>
              <li>Maintain good lighting on your face</li>
              <li>Keep a neutral expression</li>
            </ol>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'I Understand',
        cancelButtonText: 'Cancel',
      });

      if (!willProceed) {
        setIsProcessing(false);
        return;
      }

      // Collect frames with better progress feedback
      const frames = [];
      const requiredFrames = 10; // Reduced from 15 for better usability
      let blinkDetected = false;
      let headMovementDetected = false;

      // Show progress dialog
      const progressSwal = Swal.mixin({
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      for (let i = 0; i < requiredFrames; i++) {
        progressSwal.fire({
          title: 'Capturing Face Data',
          html: `
            Progress: ${Math.round((i / requiredFrames) * 100)}%<br>
            ${i < 3 ? 'Please blink naturally...' : 
              i < 6 ? 'Slowly turn your head left...' :
              i < 9 ? 'Slowly turn your head right...' :
              'Almost done...'}
          `
        });

        // Add delay for natural movement
        await new Promise(resolve => setTimeout(resolve, 300));

        const frame = webcamRef.current?.getScreenshot();
        if (!frame) continue;

        const detection = await detectFace(frame);
        if (!detection) {
          throw new Error('Face not clearly visible. Please adjust your position.');
        }

        const { landmarks, descriptor } = detection;
        const metrics = await calculateFaceMetrics(landmarks);

        // More lenient thresholds for blink and movement detection
        if (metrics.eyeAspectRatio < 0.25) {
          blinkDetected = true;
        }

        if (Math.abs(metrics.headPose.yaw) > 10) {
          headMovementDetected = true;
        }

        frames.push({
          descriptor,
          landmarks,
          metrics,
          timestamp: Date.now()
        });
      }

      progressSwal.close();

      // Validate with more detailed feedback
      try {
        validateFrameCollection(frames, blinkDetected, headMovementDetected);
      } catch (validationError) {
        throw new Error(`Validation failed: ${validationError.message}`);
      }

      // Process and save face data
      const processedData = await processFaceData(frames);
      await saveFaceData(processedData, userData._id);

      setHasFaceEnabled(true);
      setIsCameraOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Face ID has been successfully set up',
        icon: 'success'
      });

    } catch (error) {
      console.error('Face capture error:', error);
      Swal.fire({
        title: 'Setup Failed',
        text: error.message || 'Failed to set up Face ID. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try Again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for face processing
  const captureFrame = async (webcam) => {
    if (!webcam || !webcam.video?.readyState === 4) {
      throw new Error('Camera not ready');
    }
    return webcam.getScreenshot();
  };

  const detectFace = async (frame) => {
    const img = new Image();
    img.src = frame;
    await new Promise(resolve => { img.onload = resolve; });

    return faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  const calculateFaceMetrics = async (landmarks) => {
    return {
      eyeAspectRatio: calculateEyeAspectRatio(landmarks),
      headPose: calculateHeadPose(landmarks),
      faceSymmetry: calculateFaceSymmetry(landmarks),
      skinTexture: analyzeSkinTexture(landmarks)
    };
  };

  const validateFrameCollection = (frames, blinkDetected, headMovementDetected) => {
    // Minimum required frames (reduced for better user experience)
    if (frames.length < 8) {
      throw new Error('Not enough valid frames captured. Please try again.');
    }

    // Check blink detection with more detailed feedback
    if (!blinkDetected) {
      throw new Error('No blink detected. Please blink naturally during the capture.');
    }

    // Check head movement with more detailed feedback
    if (!headMovementDetected) {
      throw new Error('No head movement detected. Please turn your head slightly left and right.');
    }

    // Validate frame consistency with more lenient thresholds
    const descriptorConsistency = calculateDescriptorConsistency(frames);
    const movementNaturalness = analyzeMovementNaturalness(frames);
    
    if (descriptorConsistency < 0.7) {
      throw new Error('Face consistency check failed. Please keep your face steady.');
    }

    if (movementNaturalness < 0.6) {
      throw new Error('Movement appears unnatural. Please move more smoothly.');
    }

    return true;
  };

  const selectBestFrame = (frames) => {
    // Select the best frame based on quality metrics
    return frames.reduce((best, current) => {
      const currentQuality = calculateFrameQuality(current);
      const bestQuality = calculateFrameQuality(best);
      return currentQuality > bestQuality ? current : best;
    });
  };

  const calculateFrameQuality = (frame) => {
    if (!frame || !frame.metrics) return 0;

    // Weight different quality factors
    const weights = {
      eyeAspectRatio: 0.2,    // Eye openness
      faceSymmetry: 0.3,      // Face alignment
      headPose: 0.3,          // Head position
      skinTexture: 0.2        // Image clarity
    };

    // Calculate weighted quality score
    let qualityScore = 0;
    
    // Check eye aspect ratio (eyes should be open)
    const idealEyeAspectRatio = 0.3;
    const eyeScore = 1 - Math.abs(frame.metrics.eyeAspectRatio - idealEyeAspectRatio);
    qualityScore += eyeScore * weights.eyeAspectRatio;

    // Check face symmetry
    qualityScore += frame.metrics.faceSymmetry * weights.faceSymmetry;

    // Check head pose (should be relatively frontal)
    const headPoseScore = 1 - (
      Math.abs(frame.metrics.headPose.yaw) / 45 +   // Normalize yaw to [0,1]
      Math.abs(frame.metrics.headPose.pitch) / 30 + // Normalize pitch to [0,1]
      Math.abs(frame.metrics.headPose.roll) / 30    // Normalize roll to [0,1]
    ) / 3;
    qualityScore += headPoseScore * weights.headPose;

    // Check skin texture (clarity)
    qualityScore += frame.metrics.skinTexture * weights.skinTexture;

    return qualityScore;
  };

  const processFaceData = async (frames) => {
    const bestFrame = selectBestFrame(frames);
    return {
      faceDescriptor: Array.from(bestFrame.descriptor),
      livenessScore: calculateLivenessScore(frames),
      depthMap: generateDepthMap(bestFrame.landmarks),
      qualityScore: calculateQualityScore(frames),
      securityMetrics: {
        spoofingScore: calculateSpoofingScore(frames),
        movementNaturalness: analyzeMovementNaturalness(frames),
        textureConsistency: calculateTextureConsistency(frames)
      }
    };
  };

  const calculateLivenessScore = (frames) => {
    if (frames.length < 2) return 0;

    const scores = {
      blinkNaturalness: calculateBlinkNaturalness(frames),
      movementSmoothing: calculateMovementSmoothing(frames[0].landmarks, frames[1].landmarks, frames[2].landmarks),
      descriptorConsistency: calculateDescriptorConsistency(frames)
    };

    return (scores.blinkNaturalness + scores.movementSmoothing + scores.descriptorConsistency) / 3;
  };

  const calculateBlinkNaturalness = (frames) => {
    let blinkScore = 0;
    let blinkCount = 0;
    let lastEAR = frames[0].metrics.eyeAspectRatio;

    for (let i = 1; i < frames.length; i++) {
      const currentEAR = frames[i].metrics.eyeAspectRatio;
      
      // Detect blink
      if (lastEAR > 0.25 && currentEAR < 0.25) {
        blinkCount++;
        
        // Check blink speed and smoothness
        const blinkTransition = Math.abs(currentEAR - lastEAR);
        blinkScore += (blinkTransition < 0.15) ? 1 : 0.5;
      }
      
      lastEAR = currentEAR;
    }

    return blinkCount > 0 ? blinkScore / blinkCount : 0;
  };

  const generateDepthMap = (landmarks) => {
    const depthPoints = [];
    const points = landmarks.positions;

    // Generate relative depth values for key facial points
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const depth = calculateDepth(point, landmarks);
      depthPoints.push({
        x: point.x,
        y: point.y,
        z: depth
      });
    }

    return depthPoints;
  };

  const saveFaceData = async (processedData, userId) => {
    return axios.post(`${import.meta.env.VITE_API}/user/save-face`, {
      userId,
      ...processedData
    });
  };

  // Helper functions for liveness detection
  const getEyeAspectRatio = (eye) => {
    // Get vertical eye landmarks
    const p1 = eye[1], p2 = eye[5];
    const p3 = eye[2], p4 = eye[4];
    
    // Get horizontal eye landmarks
    const p5 = eye[0], p6 = eye[3];

    // Calculate euclidean distances
    const verticalDist1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const verticalDist2 = Math.sqrt(Math.pow(p4.x - p3.x, 2) + Math.pow(p4.y - p3.y, 2));
    const horizontalDist = Math.sqrt(Math.pow(p6.x - p5.x, 2) + Math.pow(p6.y - p5.y, 2));

    // Calculate eye aspect ratio
    return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
  };

  const calculateEyeAspectRatio = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEAR = getEyeAspectRatio(leftEye);
    const rightEAR = getEyeAspectRatio(rightEye);
    
    return (leftEAR + rightEAR) / 2.0;
  };

  const calculateHeadPose = (landmarks) => {
    const nose = landmarks.getNose();
    const jawOutline = landmarks.getJawOutline();
    
    // Calculate yaw (left-right rotation)
    const yaw = calculateYaw(nose, jawOutline);
    
    // Calculate pitch (up-down rotation)
    const pitch = calculatePitch(nose, jawOutline);
    
    // Calculate roll (tilt)
    const roll = calculateRoll(nose, jawOutline);
    
    return { yaw, pitch, roll };
  };

  const calculateYaw = (nose, jawOutline) => {
    const nosePoint = nose[0];
    const leftJaw = jawOutline[0];
    const rightJaw = jawOutline[jawOutline.length - 1];
    
    const leftDist = Math.sqrt(Math.pow(nosePoint.x - leftJaw.x, 2) + Math.pow(nosePoint.y - leftJaw.y, 2));
    const rightDist = Math.sqrt(Math.pow(nosePoint.x - rightJaw.x, 2) + Math.pow(nosePoint.y - rightJaw.y, 2));
    
    return (rightDist - leftDist) / (rightDist + leftDist) * 100;
  };

  const calculatePitch = (nose, jawOutline) => {
    const noseTop = nose[0];
    const noseTip = nose[3];
    const jawCenter = jawOutline[Math.floor(jawOutline.length / 2)];
    
    const verticalDist = Math.abs(noseTip.y - noseTop.y);
    const expectedDist = Math.abs(jawCenter.y - noseTop.y) * 0.3;
    
    return (verticalDist - expectedDist) / expectedDist * 100;
  };

  const calculateRoll = (nose, jawOutline) => {
    const leftJaw = jawOutline[0];
    const rightJaw = jawOutline[jawOutline.length - 1];
    
    return Math.atan2(rightJaw.y - leftJaw.y, rightJaw.x - leftJaw.x) * (180 / Math.PI);
  };

  const calculateFaceSymmetry = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const jawOutline = landmarks.getJawOutline();
    
    // Calculate symmetry score based on landmark positions
    const symmetryScore = calculateSymmetryScore(leftEye, rightEye, nose, jawOutline);
    return symmetryScore;
  };

  const calculateSymmetryScore = (leftEye, rightEye, nose, jawOutline) => {
    // Calculate center line
    const centerX = nose[0].x;
    
    // Compare distances of corresponding points from center
    let totalDiff = 0;
    const pairs = [
      [leftEye[0], rightEye[3]],
      [leftEye[3], rightEye[0]],
      [jawOutline[0], jawOutline[jawOutline.length - 1]]
    ];
    
    pairs.forEach(([left, right]) => {
      const leftDist = Math.abs(centerX - left.x);
      const rightDist = Math.abs(right.x - centerX);
      totalDiff += Math.abs(leftDist - rightDist);
    });
    
    return 1 - (totalDiff / (pairs.length * centerX));
  };

  const analyzeSkinTexture = (landmarks) => {
    // This is a simplified version. In production, you'd want more sophisticated texture analysis
    return 1.0; // Return a placeholder value
  };

  const calculateDescriptorConsistency = (frames) => {
    if (frames.length < 2) return 0;
    
    let totalSimilarity = 0;
    const comparisons = frames.length - 1;
    
    for (let i = 0; i < comparisons; i++) {
      const similarity = calculateCosineSimilarity(
        frames[i].descriptor,
        frames[i + 1].descriptor
      );
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / comparisons;
  };

  const calculateCosineSimilarity = (descriptor1, descriptor2) => {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      norm1 += descriptor1[i] * descriptor1[i];
      norm2 += descriptor2[i] * descriptor2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  };

  const analyzeMovementNaturalness = (frames) => {
    if (frames.length < 3) return 0;
    
    let naturalMovement = 0;
    const comparisons = frames.length - 2;
    
    for (let i = 0; i < comparisons; i++) {
      const movement = calculateMovementSmoothing(
        frames[i].landmarks,
        frames[i + 1].landmarks,
        frames[i + 2].landmarks
      );
      naturalMovement += movement;
    }
    
    return naturalMovement / comparisons;
  };

  const calculateMovementSmoothing = (landmarks1, landmarks2, landmarks3) => {
    // Calculate movement smoothness using three consecutive frames
    // This is a simplified version. In production, you'd want more sophisticated movement analysis
    return 0.9; // Return a placeholder value
  };

  const calculateQualityScore = (frames) => {
    return frames.reduce((total, frame) => {
      const clarity = 1.0; // Placeholder for image clarity calculation
      const lighting = 1.0; // Placeholder for lighting quality calculation
      const pose = 1.0; // Placeholder for pose quality calculation
      
      return total + (clarity + lighting + pose) / 3;
    }, 0) / frames.length;
  };

  const calculateSpoofingScore = (frames) => {
    // Implement sophisticated anti-spoofing detection here
    return 0.95; // Return a placeholder value
  };

  const calculateTextureConsistency = (frames) => {
    // Implement texture consistency analysis here
    return 0.9; // Return a placeholder value
  };

  const calculateDepth = (point, landmarks) => {
    // Implement depth estimation here
    return 0.5; // Return a placeholder value
  };

  const handleDisableFaceLogin = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API}/user/disable-face/${userData._id}`);
      setHasFaceEnabled(false);
      Swal.fire('Success', 'Face login disabled successfully', 'success');
    } catch (error) {
      console.error('Error disabling face login:', error);
      Swal.fire('Error', 'Failed to disable face login', 'error');
    }
  };

  // Add this useEffect to ensure webcam is properly initialized
  useEffect(() => {
    if (isCameraOpen) {
      const initializeWebcam = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: 640,
              height: 480,
              facingMode: "user"
            }
          });
          
          if (webcamRef.current) {
            webcamRef.current.video.srcObject = stream;
          }
        } catch (error) {
          console.error('Webcam initialization error:', error);
          Swal.fire({
            title: 'Camera Error',
            text: 'Failed to initialize camera. Please check permissions and try again.',
            icon: 'error'
          });
        }
      };

      initializeWebcam();

      // Cleanup function
      return () => {
        if (webcamRef.current?.video?.srcObject) {
          const tracks = webcamRef.current.video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    }
  }, [isCameraOpen]);

  return (
    <>
      <div className='myprofile_nav'> <Header /> </div>
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          margin: "auto",
          maxWidth: 600,
          mt: 5,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' ? "#333" : "#f9f9f9",
          color: theme.palette.mode === 'dark' ? "#fff" : "#000",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4} position="relative">
          <Avatar
            alt={profileData.displayName || "User"}
            src={profileData.image ? profileData.image : "/placeholder-avatar.png"}
            sx={{
              width: 150,
              height: 150,
              mb: 1,
              border: `4px solid ${theme.palette.primary.main}`,
            }}
          />
          <IconButton
            component="label"
            sx={{
              position: "absolute",
              bottom: 28,
              right: "37%",
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              '&:hover': { backgroundColor: theme.palette.primary.dark },
            }}
          >
            <input hidden accept=".jpg,.jpeg,.png" type="file" onChange={handleImageUpload} />
            <AddAPhotoIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" mt={2}>
            {profileData.displayName}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Name Field */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Name:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="displayName"
                  value={profileData.displayName || ""}
                  onChange={handleInputChange}
                  error={!!errors.displayName}
                  sx={{ color: theme.palette.text.primary }}
                />
                {errors.displayName && <FormHelperText error>{errors.displayName}</FormHelperText>}
              </>
            ) : (
              <Typography variant="h6">{profileData.displayName}</Typography>
            )}
          </Grid>

          {/* Email Field */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Email:
            </Typography>
           {editMode ? <TextField
              fullWidth
              name="email"
              value={profileData.email || ""}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
              sx={{ color: theme.palette.text.primary }}
            /> : <Typography variant="h6">{profileData.email}</Typography>}
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Phone Number:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="phone_no"
                  value={profileData.phone_no || ""}
                  onChange={handleInputChange}
                  error={!!errors.phone_no}
                  sx={{ color: theme.palette.text.primary }}
                />
                {errors.phone_no && <FormHelperText error>{errors.phone_no}</FormHelperText>}
              </>
            ) : (
              <Typography variant="h6">{profileData.phone_no}</Typography>
            )}
          </Grid>

          {/* Date of Birth */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Date of Birth:
            </Typography>
            {editMode ? (
              <>
                <TextField
                  fullWidth
                  name="dob"
                  type="date"
                  value={profileData.dob || ""}
                  onChange={handleInputChange}
                  error={!!errors.dob}
                  sx={{ color: theme.palette.text.primary }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]
                  }}
                />
                {errors.dob && <FormHelperText error>{errors.dob}</FormHelperText>}
              </>
            ) : (
              <Typography variant="h6">{profileData.dob}</Typography>
            )}
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Address:
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                name="address"
                value={profileData.address || ""}
                onChange={handleInputChange}
                sx={{ color: theme.palette.text.primary }}
              />
            ) : (
              <Typography variant="h6">{profileData.address}</Typography>
            )}
          </Grid>

          {/* Face Recognition Login */}
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary">
              Face Recognition Login:
            </Typography>
            {hasFaceEnabled ? (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleDisableFaceLogin}
                startIcon={<CameraAltIcon />}
                sx={{ mt: 1 }}
              >
                Disable Face Login
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsCameraOpen(true)}
                startIcon={<CameraAltIcon />}
                sx={{ mt: 1 }}
                disabled={isFaceModelLoading}
              >
                {isFaceModelLoading ? 'Loading Face Detection...' : 'Enable Face Login'}
              </Button>
            )}
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} textAlign="center">
            {editMode ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ mt: 2, mr: 2 }}
                disabled={Object.keys(errors).some(key => errors[key])}
              >
                Save
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateClick}
                sx={{ mt: 2, mr: 2 }}
              >
                Edit Profile
              </Button>
            )}

            {/* Change Password - Only show for non-Google users */}
            {!isGoogleUser && (
              !changePasswordMode ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handlePasswordChange}
                  sx={{ mt: 2 }}
                >
                  Change Password
                </Button>
              ) : (
                <Box>
                  <Typography variant="body1" color="textSecondary" mt={2}>
                    Current Password:
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    sx={{ color: theme.palette.text.primary }}
                  />
                  <Typography variant="body1" color="textSecondary" mt={2}>
                    New Password:
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    sx={{ color: theme.palette.text.primary }}
                  />
                  <Typography variant="body1" color="textSecondary" mt={2}>
                    Confirm New Password:
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    sx={{ color: theme.palette.text.primary }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePasswordSave}
                    sx={{ mt: 2 }}
                    disabled={!!passwordErrors.newPassword || !!passwordErrors.confirmPassword}
                  >
                    Save Password
                  </Button>
                </Box>
              )
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Camera Dialog */}
      <Dialog 
        open={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            position: 'relative',
            zIndex: 1000
          }
        }}
      >
        <DialogTitle>Face ID Setup</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height="100%"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
                aspectRatio: 1.333333
              }}
              mirrored={true}
              screenshotQuality={1}
              forceScreenshotSourceSize={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCameraOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFaceCapture}
            variant="contained" 
            color="primary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Capture'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add a custom styled dialog for Swal popups */}
      <div className="swal-dialog-container">
        {/* Swal will be rendered here */}
      </div>
    </>
  );
};

export default MyProfile;
