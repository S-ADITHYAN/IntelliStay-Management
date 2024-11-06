import React, { useState, useEffect } from 'react';
import './css/Style.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import LoginAuth from './LoginAuth';
import Swal from 'sweetalert2';



function StaffSignin() {
  LoginAuth();
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const [verifytoken, settoken] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ emailReset: '', otp: '', newPassword: '', confirmPassword: '' });
  
  
  
  
  const handleForgotPassword = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/staff-send-otp', { email: resetPasswordData.emailReset })
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
    console.log(resetPasswordData);
    axios.post('http://localhost:3001/staff-verify', { email: resetPasswordData.emailReset, otp: resetPasswordData.otp })
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
    axios.post('http://localhost:3001/staff-reset-password', { email: resetPasswordData.emailReset, password: resetPasswordData.newPassword,token:verifytoken })
      .then(res => {
        if (res.status === 200) {
          Swal.fire('Password reset successfully.');
          setShowForgotPassword(false);
          setOtpSent(false);
          setOtpVerified(false);
          navigate("/");
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
  

  const [formData, setFormData] = useState({
    emailsign: '',
    passwordsign: '',
  });

  const [focus, setFocus] = useState({
    errEmailsign: false,
    errPasswordsign: false,
  });

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData({
      ...formData, [name]: value
    });
  };

 

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/stafflogin', { ...formData })
      .then(res => {
        if (res.data.message === 'success') {
          localStorage.setItem('token', res.data.token);
          navigate('/dashboard');
        } else {
          Swal.fire('Oops..',res.data.message,'error');
        }
      })
      .catch(err => console.log(err));
  };

  

        

  return (
    <div className="custom-container">
      <div className="custom-forms-container">
        <div className="custom-signin">
        {!showForgotPassword ? (
          <form className="custom-sign-in-form" onSubmit={handleLogin}>
            <h2 className="custom-title">Sign In</h2>
            <div className="custom-input-field">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                name="emailsign"
                placeholder="Email"
                value={formData.emailsign}
                onChange={handleChange}
                onBlur={() => setFocus({ ...focus, errEmailsign: true })}
                focus={focus.errEmailsign.toString()}
                required
              />
              <span>Enter a valid email ID</span>
            </div>
            <div className="custom-input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="passwordsign"
                placeholder="Password"
                value={formData.passwordsign}
                pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$"
                onChange={handleChange}
                onBlur={() => setFocus({ ...focus, errPasswordsign: true })}
                focus={focus.errPasswordsign.toString()}
                required
              />
              <span>Password should be at least 6 characters and include at least 1 letter, 1 number, and 1 special character</span>
            </div>

            <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
            <input type="submit" value="Login" className="custom-btn solid" />
            {/* <p className="custom-social-text">Or Sign in with social platforms</p>
            <div className="custom-social-media">
              <a href="#" className="custom-social-icon" onClick={signInWithGoogle}>
                <i className="fab fa-google"></i>
              </a>
            </div> */}
          </form>
           ) : (
            <form className="custom-sign-in-form">
              {!otpSent ? (
                <>
                
                  <h2 className="custom-title">Forgot Password</h2>
                  <div className="custom-input-field">
                    <i className="fas fa-envelope"></i>
                    <input type="email" name="emailReset" placeholder="Enter your email" value={resetPasswordData.emailReset} onChange={handleResetPasswordChange} required />
                  </div>
                  <input type="submit" value="Send OTP" className="custom-btn solid" onClick={handleForgotPassword} />
                </>
              ) : !otpVerified ? (
                <>
                  <h2 className="custom-title">Verify OTP</h2>
                  <div className="custom-input-field">
                    <i className="fas fa-key"></i>
                    <input type="text" name="otp" placeholder="Enter OTP" value={resetPasswordData.otp} onChange={handleResetPasswordChange} required />
                  </div>
                  <input type="submit" value="Verify OTP" className="custom-btn solid" onClick={handleVerifyOtp} />
                </>
              ) : (
                <>
                  <h2 className="custom-title">Reset Password</h2>
                  <div className="custom-input-field">
                    <i className="fas fa-lock"></i>
                    <input type="password" name="newPassword" pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])([a-zA-Z\d[^a-zA-Z\d]]{6,50})$" placeholder="New Password" value={resetPasswordData.newPassword} onChange={handleResetPasswordChange}  onBlur={()=>setFocus({...focus,errnewPassword: true})} focus={focus.errnewPassword.toString()} required />
                    <span>Password must be at least 6 characters long and include a letter, number, and special character</span>
                  </div><br></br>
                  <div className="custom-input-field">
                    <i className="fas fa-lock"></i>
                    <input type="password" name="confirmPassword" pattern={resetPasswordData.newPassword} placeholder="Confirm Password" value={resetPasswordData.confirmPassword} onChange={handleResetPasswordChange}  onBlur={()=>setFocus({...focus,errconfirmPassword: true})} focus={focus.errconfirmPassword.toString()} required />
                    <span>password not matching</span>
                  </div>
                  <input type="submit" value="Reset Password" className="custom-btn solid" onClick={handleResetPassword} />
                </>
              )}
            </form>
          )}
        </div>
      </div>
      <div className="custom-panels-container">
        <div className="custom-panel custom-left-panel">
          <div className="custom-content">
            <h3>Welcome to IntelliStay</h3>
            <p>    Staff Sign in.                            </p> 
          </div>
           <img src="img/log.svg" className="custom-image" alt="" /> 
        </div>
      </div>
    </div>
  );
}

export default StaffSignin;
