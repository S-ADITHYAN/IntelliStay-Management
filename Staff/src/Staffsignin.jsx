import React, { useState, useEffect } from 'react';
import './css/Style.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import LoginAuth from './LoginAuth';




function StaffSignin() {
  LoginAuth();
  axios.defaults.withCredentials = true;

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

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/stafflogin', { ...formData })
      .then(res => {
        if (res.status === 200) {
          localStorage.setItem('token', res.data.token);
          navigate('/dashboard');
        } else {
          alert(res.data);
        }
      })
      .catch(err => console.log(err));
  };

  

        

  return (
    <div className="custom-container">
      <div className="custom-forms-container">
        <div className="custom-signin">
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
                onChange={handleChange}
                onBlur={() => setFocus({ ...focus, errPasswordsign: true })}
                focus={focus.errPasswordsign.toString()}
                required
              />
              <span>Password should be at least 6 characters and include at least 1 letter, 1 number, and 1 special character</span>
            </div>
            <input type="submit" value="Login" className="custom-btn solid" />
            {/* <p className="custom-social-text">Or Sign in with social platforms</p>
            <div className="custom-social-media">
              <a href="#" className="custom-social-icon" onClick={signInWithGoogle}>
                <i className="fab fa-google"></i>
              </a>
            </div> */}
          </form>
        </div>
      </div>
      <div className="custom-panels-container">
        <div className="custom-panel custom-left-panel">
          <div className="custom-content">
            <h3>Welcome to Staff Login.</h3>
            <p>                                              </p> 
          </div>
           <img src="img/log.svg" className="custom-image" alt="" /> 
        </div>
      </div>
    </div>
  );
}

export default StaffSignin;
