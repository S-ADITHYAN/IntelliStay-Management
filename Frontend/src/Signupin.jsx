
import React, { useState ,useEffect} from 'react';
import './Style.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "./Firebase_config"; // Ensure firebaseApp is correctly initialized
import Swal from 'sweetalert2';
import LoginAuth from './LoginAuth';

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




const handleForgotPassword = (e) => {
  e.preventDefault();
  axios.post('http://localhost:3001/send-otp', { email: resetPasswordData.emailReset })
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
  axios.post('http://localhost:3001/verify', { email: resetPasswordData.emailReset, otp: resetPasswordData.otp })
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
  axios.post('http://localhost:3001/reset-password', { email: resetPasswordData.emailReset, password: resetPasswordData.newPassword,token:verifytoken })
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
//     axios.post('http://localhost:3001/register',{...formData})
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
  axios.post('http://localhost:3001/register', formData)
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
  axios.post('http://localhost:3001/verify-otp', datas)
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
    axios.post('http://localhost:3001/login',{...formData})
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
//   window.open("http://localhost:3001/auth/google/callback","_self")
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

       


        axios.post("http://localhost:3001/authWithGoogle", fields).then((res) => {
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


  
  return (
    <div className={`container ${signUpMode ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">
        {!showForgotPassword ? (
          <form className="sign-in-form" onSubmit={handleLogin}>
            <h2 className="title">Sign in</h2>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input id="email" type="email" name="emailsign" placeholder="Email" value={formData.emailsign} onChange={handleChange} onBlur={()=>setFocus({...focus,errEmailsign: true})} focus={focus.errEmailsign.toString()} required />
              <span>Enter a valid email id</span>
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input id="password" type="password" name="passwordsign" pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$" placeholder="Password" value={formData.passwordsign} onChange={handleChange}  onBlur={()=>setFocus({...focus,errPasswordsign: true})} focus={focus.errPasswordsign.toString()} required />
              <span>Password must be at least 6 characters long and include a letter, number, and special character</span>
            </div><br></br>
            <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
            <input type="submit" id="login" value="Login" className="btn solid" />
            
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
