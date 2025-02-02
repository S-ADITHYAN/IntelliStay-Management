import React, { useEffect,useState } from 'react';
import './Header.css';
import logo from '../public/logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScrollReveal from 'scrollreveal'; 
import { jwtDecode } from "jwt-decode";
import { FaUtensils } from 'react-icons/fa';

 function Header() {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const token=localStorage.getItem("token");

    useEffect(() => {
      const menuBtn = document.getElementById("menu-btn");
      const navLinks = document.getElementById("nav-links");
      const menuBtnIcon = menuBtn.querySelector("i");
  
      const toggleMenu = () => {
        navLinks.classList.toggle("open");
        const isOpen = navLinks.classList.contains("open");
        menuBtnIcon.setAttribute("className", isOpen ? "ri-close-line" : "ri-menu-line");
      };
  
      menuBtn.addEventListener("click", toggleMenu);
      navLinks.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuBtnIcon.setAttribute("className", "ri-menu-line");
      });
  
      const scrollRevealOption = {
        distance: "50px",
        origin: "bottom",
        duration: 1000,
      };
  
      ScrollReveal().reveal(".header__container p", {
        ...scrollRevealOption,
      });
  
      ScrollReveal().reveal(".header__container h1", {
        ...scrollRevealOption,
        delay: 500,
      });
  
      ScrollReveal().reveal(".about__image img", {
        ...scrollRevealOption,
        origin: "left",
      });
  
      ScrollReveal().reveal(".about__content .section__subheader", {
        ...scrollRevealOption,
        delay: 500,
      });
  
      ScrollReveal().reveal(".about__content .section__header", {
        ...scrollRevealOption,
        delay: 1000,
      });
  
      ScrollReveal().reveal(".about__content .section__description", {
        ...scrollRevealOption,
        delay: 1500,
      });
  
      ScrollReveal().reveal(".about__btn", {
        ...scrollRevealOption,
        delay: 2000,
      });
  
      ScrollReveal().reveal(".room__card", {
        ...scrollRevealOption,
        interval: 500,
      });
  
      ScrollReveal().reveal(".service__list li", {
        ...scrollRevealOption,
        interval: 500,
        origin: "right",
      });
  
      // Cleanup listeners on component unmount
  
      return () => {
        menuBtn.removeEventListener("click", toggleMenu);
        navLinks.removeEventListener("click", () => {});
      };
    }, []);
    axios.defaults.withCredentials = true;
    const handleLogout = () => {
      axios.post(`${import.meta.env.VITE_API}/user/logout`)
        .then(res => {
          if (res.status === 200) {
            localStorage.removeItem('userEmail');
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("displayName");
            // localStorage.setItem('signout', 'signout');
            navigate("/signup"); // Redirect to public route
          }
        })
        .catch(err => {
          console.error("Error logging out:", err);
        });
    };
    const [user, setUser] = useState('');
    const handleUser=(displayName)=>{
      if(displayName){
        setUser(displayName);
      }
      else{
        navigate('/signup')
      }
  
    }
  
    useEffect(() => {
      const displayName = localStorage.getItem('displayName');
      if (displayName) {
        handleUser(displayName);
       
      } else {
        setUser('');
         // Redirect to login if no session found
      }
    }, []);

    // Add mouseEnter and mouseLeave handlers
    const handleMouseEnter = () => {
      setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
      setDropdownOpen(false);
    };

    // Add click handler for dropdown items
    const handleDropdownClick = (e, path) => {
      e.preventDefault();
      navigate(path);
      setDropdownOpen(false);
    };

  return (
    <div>
      
    
        <nav>
          <div className="nav__bar">
            <div className="logo">
              <a href="#home"><img src={logo} alt="logo" onClick={()=>{navigate('/')}}/></a> 
              {/* <h2 style={{ color: '#fff' }}>IntelliStay</h2> */}

            </div>
            <div className="nav__menu__btn" id="menu-btn">
              <i className="ri-menu-line"></i>
            </div>
          </div>
          <ul className="nav__links" id="nav-links">
            <li><a href="#home" onClick={()=>{navigate('/')}}>Home</a></li>
            <li><a href="#about" onClick={()=>{navigate('/')}}>About</a></li>
            <li><a href="#service" onClick={()=>{navigate('/')}}>Services</a></li>
            <li><a href="#gallery" onClick={()=>{navigate('/')}}>Gallery</a></li>
            <li><a href="#contact" onClick={()=>{navigate('/')}}>Contact</a></li>
            <li 
              className="dropdown" 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <a href="#" className="restaurant-link">
                <FaUtensils className="nav-icon" /> Restaurant
              </a>
              <div className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>
                 {/* Always show these items regardless of authentication */}
              <a href="/restaurant/menu" onClick={(e) => handleDropdownClick(e, '/restaurant/menu')}>
                View Menu
              </a>
              {token ? (
                // Show these items only if user is logged in
                <>
                  <a href="/restaurant/cart" onClick={(e) => handleDropdownClick(e, '/restaurant/cart')}>
                    My Cart
                  </a>
                  <a href="/restaurant/reservations" onClick={(e) => handleDropdownClick(e, '/restaurant/reservations')}>
                Book Table
              </a>
                  <a href="/restaurant/orders" onClick={(e) => handleDropdownClick(e, '/restaurant/orders')}>
                    My Orders
                  </a>
                  <a href="/restaurant/table-reservations" onClick={(e) => handleDropdownClick(e, '/restaurant/table-reservations')}>
                    Table Reservation
                  </a>
                </>
              ) : null}
             
              
             </div>
              {/* <div className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>
                <a href="/restaurant/cart" onClick={(e) => handleDropdownClick(e, '/restaurant/cart')}>
                  My Cart
                </a>
                <a href="/restaurant/menu" onClick={(e) => handleDropdownClick(e, '/restaurant/menu')}>
                  View Menu
                </a>
                <a href="/restaurant/reservations" onClick={(e) => handleDropdownClick(e, '/restaurant/reservations')}>
                  Book Table
                </a>
                <a href="/restaurant/orders" onClick={(e) => handleDropdownClick(e, '/restaurant/orders')}>
                  My Orders
                </a>
                <a href="/restaurant/table-reservations" onClick={(e) => handleDropdownClick(e, '/restaurant/table-reservations')}>
                  Table Reservation
                </a>
              </div> */}
            </li>
            {user ? (
                <>
                 
                  <li className="dropdown">
                        <a href="" className="username">Hi, {user}</a>
                            <div className="dropdown-content">
                              <a href="/qrscanner">QR Scanner</a>
                                  <a href="/myprofile">Profile</a>
                                  <a href="/guide">Guide</a>
                                   <a href="/my-bookings" id='my-bookings'>My Bookings</a>
                                   <a href="/saved-guests">Saved Guests</a>
                                   <a href="" onClick={handleLogout}>Logout</a>
                            </div>
                   </li>
              </>
            
              
            ) : (
              <li>
               <a href="" onClick={() => navigate('/signup')} > Login</a>
              </li>
            )}
            {/*<li><a href="#" onClick={handleLogout}>Logout</a></li>
            <li><a href="#"></a>{user}</li>
            */}
          </ul>
        <button className="btn nav__btn" onClick={() => navigate('/rooms')}>Book Now</button> 
        </nav>
        
    </div>
  )
}

export default Header;