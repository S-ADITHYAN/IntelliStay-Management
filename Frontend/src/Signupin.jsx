import React, { useState ,useEffect, useRef} from 'react';
import './Style.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "./Firebase_config"; // Ensure firebaseApp is correctly initialized
import Swal from 'sweetalert2';
import LoginAuth from './LoginAuth';
import * as faceapi from 'face-api.js';

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

function Signupin() {
  LoginAuth();
  axios.defaults.withCredentials = true;
  const [signUpMode, setSignUpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifytoken, settoken] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
const [otpSent, setOtpSent] = useState(false);
const [otpVerified, setOtpVerified] = useState(false);
const [resetPasswordData, setResetPasswordData] = useState({ emailReset: '', otp: '', newPassword: '', confirmPassword: '' });

const [useFaceLogin, setUseFaceLogin] = useState(false);
const [faceEmail, setFaceEmail] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
const [prompt, setPrompt] = useState('');
const videoRef = useRef(null);
const streamRef = useRef(null);
const [verificationAttempts, setVerificationAttempts] = useState(0);
const [lastFailedAttempt, setLastFailedAttempt] = useState(null);
const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);

const handleForgotPassword = (e) => {
  e.preventDefault();
  axios.post(`${import.meta.env.VITE_API}/send-otp`, { email: resetPasswordData.emailReset })
    .then(res => {
      if (res.status === 200) {
        setOtpSent(true);
        Swal.fire('OTP sent to your email.');
      }
      else{
        Swal.fire(res.data.message);
      }
    })
    .catch(err => console.log(err));
};


const handleVerifyOtp = (e) => {
  e.preventDefault();
  axios.post(`${import.meta.env.VITE_API}/verify`, { email: resetPasswordData.emailReset, otp: resetPasswordData.otp })
    .then(res => {
      if (res.status === 200) {
        setOtpVerified(true);
        Swal.fire('OTP verified successfully.');
        settoken(res.data.token)
        consolelog(verifytoken)

      }
      else{
        Swal.fire(res.data.message);
      }
    })
    .catch(err => console.log(err));
};

const handleResetPassword = (e) => {
  e.preventDefault();
  if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
    Swal.fire('Passwords do not match!');
    return;
  }
  axios.post(`${import.meta.env.VITE_API}/reset-password`, { email: resetPasswordData.emailReset, password: resetPasswordData.newPassword,token:verifytoken })
    .then(res => {
      if (res.status === 200) {
        Swal.fire('Password reset successfully.');
        setShowForgotPassword(false);
        setOtpSent(false);
        setOtpVerified(false);
      }
      else{
        Swal.fire(res.data.message);
      }
    })
    .catch(err => console.log(err));
};



const handleResetPasswordChange = (e) => {
  setResetPasswordData({ ...resetPasswordData, [e.target.name]: e.target.value });
};

  const handleSignUpClick = () => {
    setSignUpMode(true);
  };

  const handleSignInClick = () => {
    setSignUpMode(false);
  };
  const [datas,setdatas]=useState({});
const [formData, setFormData] = useState({
    firstname: '',
    email: '',
    password: '',
    cpassword: '',
    emailsign: '',
    passwordsign: '',

});

const[focus, setFocus]=useState({
    errFirstname: false,
    errEmail: false,
    errPassword: false,
    errCpassword: false,
    errEmailsign: false,
    errPasswordsign: false,
    errnewPassword: false,
    errconfirmPassword: false,
})




const handleChange=(e)=>{
    const name=e.target.name;
    const value=e.target.value;
    setFormData({
        ...formData, [name] : value
    })
}
const navigate=useNavigate();

// const handleSubmit=(e)=>{
//     e.preventDefault()
//     axios.post('${import.meta.env.VITE_API}/register',{...formData})
//     .then(res =>{console.log(res)
//       if(res.data==="exists"){
//         Swal.fire("email already exists...")
//       }
//       else{
//         setSignUpMode(false);
//         Swal.fire("submitted successfully. :)")}
//     })
//     .catch(err => console.log(err)) 
// }


const handleSubmit = (e) => {
  e.preventDefault();
  // Send registration request
  axios.post(`${import.meta.env.VITE_API}/register`, formData)
    .then(res => {
      console.log(res.data.formdata)
      setdatas({...res.data.formdata})
      if (res.data.message === 'OTP sent to your email.') {
        
        setIsOtpSent(true); 
        

        // OTP was sent, show OTP input
      }
      if (res.data.message === 'Email already exists.') {
        Swal.fire("email already exists...")
        // OTP was sent, show OTP input
      }
    })
    .catch(err => console.log(err));
};

const handleOtpSubmit = () => {
  // Send OTP verification request
  
  setdatas({...datas, otp : otp })
  console.log(datas);
  axios.post(`${import.meta.env.VITE_API}/verify-otp`, datas)
    .then(res => {
      if (res.status === 200) {

        setIsOtpVerified(true);
        setSignUpMode(false);
        Swal.fire('Registration completed successfully!');
      }else if(res.status === 400){
        Swal.fire('Error',res.data.message,'error');
      }
       else {
        Swal.fire('Invalid OTP, please try again.');
      }
    })
    .catch(err => console.log(err));
};

const handleLogin=(e)=>{
    e.preventDefault()
    axios.post(`${import.meta.env.VITE_API}/user/login`,{...formData})
    .then(res => {console.log(res.data)
      
        if(res.data.message === 'success'){
          localStorage.setItem('userEmail', res.data.data);
          localStorage.setItem('userId', res.data.id);
          localStorage.setItem('token', res.data.token);
          localStorage.setItem("displayName",res.data.displayName);
            navigate('/')
        }else
        {
          Swal.fire(res.data)
        }
    })
    .catch(err => console.log(err))
}

// const loginwithgoogle=()=>{
//   window.open("${import.meta.env.VITE_API}/auth/google/callback","_self")
// }


const signInWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;

        const fields = {
          name: user.providerData[0].displayName,
          email: user.providerData[0].email,
          password: null,
          images: user.providerData[0].photoURL,
        };

       


        axios.post(`${import.meta.env.VITE_API}/user/authWithGoogle`, fields).then((res) => {
          try {
            if (res.status === 200) {
              localStorage.setItem("token", res.data.token);

              const user = {
                name: res.data.user?.name,
                email: res.data.user?.email,
                userId: res.data.user?._id,
                displayName: res.data.user?.displayName
              };

              localStorage.setItem("userEmail", user.email);
              localStorage.setItem("userId", user.userId);
              localStorage.setItem("displayName",user.displayName);

              Swal.fire(res.data.msg);
              navigate('/')

             
            } else {
              Swal.fire(res.data.msg);
              navigate('/signup')
              
            }
          } catch (error) {
            console.log(error);
           
          }
        });

        Swal.fire("User authentication successful!");
      })
      .catch((error) => {
        Swal.fire( error.message);
       
      });
  };

useEffect(() => {
  const loadFaceModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
    } catch (error) {
      console.error('Error loading face models:', error);
    }
  };
  loadFaceModels();

  // Cleanup function
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
}, []);

const handleFaceLogin = async (e) => {
  e.preventDefault();
  if (isProcessing) return;
  
  if (!faceEmail) {
    Swal.fire({
      icon: 'warning',
      title: 'Email Required',
      text: 'Please enter your email to proceed with face login'
    });
    return;
  }

  try {
    setIsProcessing(true);

    // Initialize camera
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: 640,
        height: 480,
        facingMode: "user"
      }
    });
    
    videoRef.current.srcObject = stream;
    await new Promise(resolve => videoRef.current.onloadedmetadata = () => resolve());
    videoRef.current.play();

    // Show progress
    const loadingSwal = Swal.fire({
      title: 'Face Verification',
      html: 'Please look at the camera and stay still',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Wait for face detection
    let detection = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!detection && attempts < maxAttempts) {
      detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!detection) {
      throw new Error('Unable to detect face. Please ensure good lighting and face visibility.');
    }

    // Create canvas and get image data
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Prepare verification data
    const verificationData = {
      email: faceEmail,
      faceDescriptor: Array.from(detection.descriptor).map(val => Number(val.toFixed(8))), // Ensure numeric values with fixed precision
      image: canvas.toDataURL('image/jpeg', 0.8)
    };

    // Send verification request
    const response = await axios.post(
      `${import.meta.env.VITE_API}/user/verify-face`,
      verificationData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      localStorage.setItem('userEmail', response.data.email);
      localStorage.setItem('userId', response.data._id);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem("displayName", response.data.displayName);

      await Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Welcome back!',
        timer: 1500,
        showConfirmButton: false
      });

      navigate('/');
    } else {
      throw new Error(response.data.message || 'Verification failed');
    }

  } catch (error) {
    console.error('Face login error:', error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Face verification failed';
    
    Swal.fire({
      icon: 'error',
      title: 'Verification Failed',
      text: errorMessage,
      footer: '💡 Tip: Ensure good lighting and keep your face clearly visible'
    });
  } finally {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsProcessing(false);
  }
};

// Helper functions
const calculateEyeAspectRatio = (landmarks) => {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  return (getEAR(leftEye) + getEAR(rightEye)) / 2;
};

const getEAR = (eye) => {
  const p2_p6 = euclideanDistance(eye[1], eye[5]);
  const p3_p5 = euclideanDistance(eye[2], eye[4]);
  const p1_p4 = euclideanDistance(eye[0], eye[3]);
  return (p2_p6 + p3_p5) / (2.0 * p1_p4);
};

const euclideanDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calculateHeadPose = (landmarks) => {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const jawOutline = landmarks.getJawOutline();

  // Calculate center points
  const eyeCenter = {
    x: (getMeanPoint(leftEye).x + getMeanPoint(rightEye).x) / 2,
    y: (getMeanPoint(leftEye).y + getMeanPoint(rightEye).y) / 2
  };

  const nosePoint = getMeanPoint(nose);
  const jawCenter = getMeanPoint(jawOutline);

  // Calculate angles
  const yaw = calculateYawAngle(leftEye, rightEye);
  const pitch = calculatePitchAngle(nosePoint, eyeCenter, jawCenter);
  const roll = calculateRollAngle(leftEye, rightEye);

  return { yaw, pitch, roll };
};

const getMeanPoint = (points) => {
  const sum = points.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y
  }), { x: 0, y: 0 });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
};

const calculateYawAngle = (leftEye, rightEye) => {
  const leftPoint = getMeanPoint(leftEye);
  const rightPoint = getMeanPoint(rightEye);
  
  // Calculate eye width ratio as an indicator of yaw
  const eyeDistance = euclideanDistance(leftPoint, rightPoint);
  const normalizedDistance = eyeDistance / 100; // Normalize by expected distance
  
  // Convert to angle (-30 to 30 degrees)
  return (1 - normalizedDistance) * 60 - 30;
};

const calculatePitchAngle = (nose, eyeCenter, jawCenter) => {
  // Calculate vertical ratios to determine pitch
  const eyeToNose = euclideanDistance(eyeCenter, nose);
  const noseToJaw = euclideanDistance(nose, jawCenter);
  const ratio = eyeToNose / noseToJaw;
  
  // Convert ratio to angle (-30 to 30 degrees)
  return (ratio - 0.5) * 60;
};

const calculateRollAngle = (leftEye, rightEye) => {
  const leftPoint = getMeanPoint(leftEye);
  const rightPoint = getMeanPoint(rightEye);
  
  // Calculate angle between eyes
  const deltaY = rightPoint.y - leftPoint.y;
  const deltaX = rightPoint.x - leftPoint.x;
  
  // Convert to degrees
  return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
};

const calculateDepthVariance = (frames) => {
  if (frames.length < 2) return 0;
  
  const depthValues = frames.map(frame => {
    const nose = getMeanPoint(frame.landmarks.filter((_, i) => i >= 27 && i <= 35));
    return nose.x; // Using x position as a simple depth indicator
  });
  
  // Calculate variance
  const mean = depthValues.reduce((a, b) => a + b) / depthValues.length;
  const variance = depthValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / depthValues.length;
  
  return Math.min(variance / 1000, 1); // Normalize to 0-1
};

const calculateTextureVariance = (frames) => {
  // Simplified texture variance calculation
  return 0.85; // Return a reasonable default value
};

const calculateHighlights = (video) => {
  // Create canvas to analyze video frame
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate average brightness
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  
  return total / (data.length / 4);
};

const calculateShadows = (video) => {
  // Similar to highlights but focus on dark areas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let darkPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness < 50) darkPixels++;
  }
  
  return darkPixels / (data.length / 4) * 255;
};

const calculateUniformity = (video) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let variance = 0;
  let mean = 0;
  
  // Calculate mean brightness
  for (let i = 0; i < data.length; i += 4) {
    mean += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  mean /= (data.length / 4);
  
  // Calculate variance
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += Math.pow(brightness - mean, 2);
  }
  variance /= (data.length / 4);
  
  // Convert to uniformity (0-1)
  return 1 - Math.min(variance / 10000, 1);
};

const calculateSpoofingScore = (frames) => {
  // Combine multiple metrics for spoofing detection
  const textureScore = calculateTextureVariance(frames);
  const movementScore = calculateMovementNaturalness(frames);
  const depthScore = calculateDepthVariance(frames);
  
  return (textureScore + movementScore + depthScore) / 3;
};

const calculateMovementNaturalness = (frames) => {
  if (frames.length < 3) return 0;
  
  let score = 0;
  for (let i = 1; i < frames.length - 1; i++) {
    const prevMetrics = frames[i - 1].metrics;
    const currentMetrics = frames[i].metrics;
    const nextMetrics = frames[i + 1].metrics;
    
    // Check for smooth movement transitions
    const smoothness = calculateMovementSmoothness(
      prevMetrics.headPose,
      currentMetrics.headPose,
      nextMetrics.headPose
    );
    score += smoothness;
  }
  
  return score / (frames.length - 2);
};

const calculateMovementSmoothness = (prev, current, next) => {
  const yawDiff1 = Math.abs(current.yaw - prev.yaw);
  const yawDiff2 = Math.abs(next.yaw - current.yaw);
  
  // Penalize sudden changes in movement
  const smoothness = 1 - Math.abs(yawDiff2 - yawDiff1) / 90;
  return Math.max(0, Math.min(1, smoothness));
};

const calculateAcceleration = (movements, currentAngle) => {
  if (movements.length < 2) return 0;
  
  const lastMovement = movements[movements.length - 1];
  const timeDiff = (Date.now() - lastMovement.timestamp) / 1000; // Convert to seconds
  
  if (timeDiff === 0) return 0;
  
  // Calculate angular velocity change
  const currentVelocity = Math.abs(currentAngle - lastMovement.angle) / timeDiff;
  const previousVelocity = lastMovement.velocity || 0;
  
  // Calculate acceleration (change in velocity over time)
  const acceleration = Math.abs(currentVelocity - previousVelocity) / timeDiff;
  
  // Normalize acceleration to a 0-1 range
  return Math.min(acceleration / 100, 1);
};

const generateDepthMap = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return [];

  // Convert landmarks to 3D points with estimated depth
  return landmarks.map(point => {
    // Calculate relative depth based on facial feature position
    let z = 0.5; // Default depth

    // Adjust depth based on facial region
    const x = point.x;
    const y = point.y;

    // Center points (nose region) should appear closer
    const centerX = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
    const centerY = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;
    
    // Calculate distance from center
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + 
      Math.pow(y - centerY, 2)
    );

    // Normalize distance to affect depth
    const maxDistance = Math.sqrt(
      Math.pow(640, 2) + // assuming 640x480 video
      Math.pow(480, 2)
    );
    
    // Adjust z based on distance from center
    z = 0.5 + (distanceFromCenter / maxDistance) * 0.5;

    return {
      x: x,
      y: y,
      z: z
    };
  });
};

// Helper function to normalize depth values
const normalizeDepth = (value, min, max) => {
  return (value - min) / (max - min);
};

// Helper function to estimate depth from facial features
const estimateDepthFromFeatures = (point, landmarks) => {
  // Define key facial feature indices
  const noseBaseIndex = 30;
  const leftEyeIndex = 36;
  const rightEyeIndex = 45;
  
  // Get distances to key features
  const distToNose = euclideanDistance(point, landmarks[noseBaseIndex]);
  const distToLeftEye = euclideanDistance(point, landmarks[leftEyeIndex]);
  const distToRightEye = euclideanDistance(point, landmarks[rightEyeIndex]);
  
  // Use average distance to estimate depth
  return (distToNose + distToLeftEye + distToRightEye) / 3;
};

  return (
    <div className={`container ${signUpMode ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">
        {!showForgotPassword ? (
          <form className="sign-in-form" onSubmit={useFaceLogin ? handleFaceLogin : handleLogin}>
            <h2 className="title">Sign in</h2>
            {useFaceLogin ? (
              <div className="face-login-container">
                <div className="input-field">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={faceEmail}
                    onChange={(e) => setFaceEmail(e.target.value)}
                    required
                  />
                </div>
                
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '300px',
                    height: '225px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: '2px solid #4481eb',
                    transform: 'scaleX(-1)',
                    display: isProcessing ? 'block' : 'none'
                  }}
                />
                
                {prompt && (
                  <div className="prompt-message">
                    {prompt}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn solid"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Face Login'}
                </button>
                
                <button 
                  type="button" 
                  className="btn transparent"
                  onClick={() => setUseFaceLogin(false)}
                  disabled={isProcessing}
                >
                  Use Password Instead
                </button>
              </div>
            ) : (
              <>
                <div className="input-field">
                  <i className="fas fa-envelope"></i>
                  <input id="email" type="email" name="emailsign" placeholder="Email" value={formData.emailsign} onChange={handleChange} onBlur={()=>setFocus({...focus,errEmailsign: true})} focus={focus.errEmailsign.toString()} required />
                  <span>Enter a valid email id</span>
                </div>
                <div className="input-field">
                  <i className="fas fa-lock"></i>
                  <input id="password" type="password" name="passwordsign" pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$" placeholder="Password" value={formData.passwordsign} onChange={handleChange} onBlur={()=>setFocus({...focus,errPasswordsign: true})} focus={focus.errPasswordsign.toString()} required />
                  <span>Password must be at least 6 characters long and include a letter, number, and special character</span>
                </div>
                <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
                <button 
                  type="button" 
                  className="btn transparent"
                  onClick={() => setUseFaceLogin(true)}
                  style={{ marginTop: '10px' ,backgroundColor:'#4481eb'}}
                >
                  Login with Face ID
                </button>
              </>
            )}
            
            <input 
              type="submit" 
              id="login"
              value={useFaceLogin ? "Verify Face" : "Login"} 
              className="btn solid" 
            />

            <div className="social-media">
              <a href="#" className="social-icon" onClick={signInWithGoogle}>
                <i className="fab fa-google"></i>
              </a>
            </div>
          </form>
        ) : (
          <form className="sign-in-form">
            {!otpSent ? (
              <>
              
                <h2 className="title">Forgot Password</h2>
                <div className="input-field">
                  <i className="fas fa-envelope"></i>
                  <input type="email" name="emailReset" placeholder="Enter your email" value={resetPasswordData.emailReset} onChange={handleResetPasswordChange} required />
                </div>
                <input type="submit" value="Send OTP" className="btn solid" onClick={handleForgotPassword} />
              </>
            ) : !otpVerified ? (
              <>
                <h2 className="title">Verify OTP</h2>
                <div className="input-field">
                  <i className="fas fa-key"></i>
                  <input type="text" name="otp" placeholder="Enter OTP" value={resetPasswordData.otp} onChange={handleResetPasswordChange} required />
                </div>
                <input type="submit" value="Verify OTP" className="btn solid" onClick={handleVerifyOtp} />
              </>
            ) : (
              <>
                <h2 className="title">Reset Password</h2>
                <div className="input-field">
                  <i className="fas fa-lock"></i>
                  <input type="password" name="newPassword" pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$" placeholder="New Password" value={resetPasswordData.newPassword} onChange={handleResetPasswordChange}  onBlur={()=>setFocus({...focus,errnewPassword: true})} focus={focus.errnewPassword.toString()} required />
                  <span>Password must be at least 6 characters long and include a letter, number, and special character</span>
                </div><br></br>
                <div className="input-field">
                  <i className="fas fa-lock"></i>
                  <input type="password" name="confirmPassword" pattern={resetPasswordData.newPassword} placeholder="Confirm Password" value={resetPasswordData.confirmPassword} onChange={handleResetPasswordChange}  onBlur={()=>setFocus({...focus,errconfirmPassword: true})} focus={focus.errconfirmPassword.toString()} required />
                  <span>password not matching</span>
                </div>
                <input type="submit" value="Reset Password" className="btn solid" onClick={handleResetPassword} />
              </>
            )}
          </form>
        )}
          <form action='#' onSubmit={handleSubmit} className="sign-up-form">
      <h2 className="title">Sign up</h2>

      {!isOtpSent ? (
        <>
          <div className="input-fields-container">
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input type="text" pattern="^[A-Za-z]+$" className='input' name="firstname" placeholder="Full name" value={FormData.firstname} onChange={handleChange} onBlur={()=>setFocus({...focus,errFirstname: true})} focus={focus.errFirstname.toString()} required/>
              <span>first name should be character</span>
            </div>
           
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input type="email" name="email" className='input'  placeholder="Email" value={FormData.email} onChange={handleChange} onBlur={()=>setFocus({...focus,errEmail: true})} focus={focus.errEmail.toString()} required/>
              <span>enter a valid email</span>
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input type="password" className='input' name="password" pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$" placeholder="Password" value={FormData.password} onChange={handleChange} onBlur={()=>setFocus({...focus,errPassword: true})} focus={focus.errPassword.toString()} required/>
              <span>password should be atleast 6 characters and include atleast 1 letter,1 number,1 special characters</span> 
            </div>
            
            
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input type="password" className='input' name="cpassword" pattern={formData.password} placeholder="Confirm Password" value={FormData.cpassword} onChange={handleChange} onBlur={()=>setFocus({...focus,errCpassword: true})} focus={focus.errCpassword.toString()} required/>
              <span>password not matching</span>
            </div>
            </div>
            
        
            <input type="submit" className="btn" value="Sign up" />
        </>
      ) : (
        <div>
          <h3 className="titleOtp">Enter the OTP sent to your email</h3>
          <div className="input-field">
          <i className="fas fa-lock"></i>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          </div>
          <button type="button" className='btn' 
           onClick={handleOtpSubmit}>
            Verify OTP
          </button>
        </div>
        
      )}

      <p className="social-text">Or Sign up with social platforms</p>
      <div className="social-media">
        <a href="#" className="social-icon" onClick={signInWithGoogle}>
          <i className="fab fa-google"></i>
        </a>
      </div>
    </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
          <h3>Welcome to IntelliStay</h3>
            <h3>New here?</h3>
            <p>
            The Best Holidays Start Here!
            Make Yourself At Home In Our Hotel..
            </p>
            <button className="btn transparent" onClick={handleSignUpClick} id="sign-up-btn">
              Sign up
            </button>
          </div>
          <img src="img/log.svg" className="image" alt="" />
        </div>
        <div className="panel right-panel">
          <div className="content">
          <h3>Welcome to IntelliStay</h3>
            <h3>One of us?</h3>
            <p>
            The Best Holidays Start Here!
            Make Yourself At Home In Our Hotel..
            </p>
            <button className="btn transparent" onClick={handleSignInClick} id="sign-in-btn">
              Sign in
            </button>
          </div>
          <img src="img/register.svg" className="image" alt="" />
        </div>
      </div>
    </div>
  );
}

export default Signupin;
