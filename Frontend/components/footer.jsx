import React from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../public/logo1.png';
import './footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Company Info Section */}
        <div className="footer-section company-info">
          <div className="logo-container">
            <img src="/logo1.png" alt="IntelliStay Logo" className="footer-logo" />
          </div>
          <p className="company-description">
            Experience luxury dining with our innovative restaurant management system. 
            Making reservations simpler and dining experiences better.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <span>+1 234 567 8900</span>
            </div>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <span>intellistay@info.com</span>
            </div>
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <span>123 Dining Street, Foodie City, FC 12345</span>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section quick-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/reservations">Reservations</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Services Section */}
        <div className="footer-section services">
          <h3>Our Services</h3>
          <ul>
            <li><Link to="/table-booking">Table Booking</Link></li>
            <li><Link to="/online-order">Online Order</Link></li>
            <li><Link to="/private-dining">Private Dining</Link></li>
            <li><Link to="/catering">Catering Service</Link></li>
            <li><Link to="/events">Special Events</Link></li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <div className="footer-section newsletter">
          <h3>Stay Connected</h3>
          <p>Subscribe to our newsletter for updates and special offers</p>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="newsletter-input"
            />
            <button className="subscribe-btn">Subscribe</button>
          </div>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebookF className="social-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram className="social-icon" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
              <FaYoutube className="social-icon" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter className="social-icon" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} INTELLISTAY Pvt LTD. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;