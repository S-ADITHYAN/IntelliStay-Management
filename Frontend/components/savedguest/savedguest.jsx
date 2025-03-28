import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import axios from 'axios';
import './SavedGuest.css';
import useAuth from '../../src/useAuth';
import { Modal, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import logo from '../../public/logo1.png';
import facebook from '../../src/assets/facebook.png';
import instagram from '../../src/assets/instagram.png';
import youtube from '../../src/assets/youtube.png';
import Footer from '../footer';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';

function SavedGuest() {
  useAuth();
  const navigate = useNavigate();
  const [savedGuests, setSavedGuests] = useState([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGuest, setEditedGuest] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const footerRef = useRef(null);

  const nameRegex = /^[A-Za-z\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  const proofNumberRegex = /^[A-Za-z0-9]+$/;

  useEffect(() => {
    const fetchSavedGuests = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('No user found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API}/user/saved-guests/${userId}`);
        if (response.status === 200) {
          setSavedGuests(response.data);
          setFilteredGuests(response.data);
        } else {
          setError('Failed to fetch saved guests');
        }
      } catch (err) {
        setError('An error occurred while fetching saved guests');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedGuests();
  }, []);

  useEffect(() => {
    const filterGuests = () => {
      let filtered = savedGuests;

      if (searchQuery) {
        filtered = savedGuests.filter(guest => {
          const searchLower = searchQuery.toLowerCase();
          return (
            guest.name.toLowerCase().includes(searchLower) ||
            guest.email.toLowerCase().includes(searchLower) ||
            guest.phone.includes(searchLower)
          );
        });
      }

      setFilteredGuests(filtered);
    };

    filterGuests();
  }, [searchQuery, savedGuests]);

  useLayoutEffect(() => {
    const footer = footerRef.current;
    if (!footer) return; // Exit if footer is not available

    let lastScrollY = window.pageYOffset;
    let footerHeight = footer.offsetHeight;
    let viewportHeight = window.innerHeight;
    let documentHeight = document.documentElement.scrollHeight;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const maxScroll = documentHeight - viewportHeight;
      const scrollPercentage = currentScrollY / maxScroll;
      const footerVisibleHeight = Math.min(footerHeight, Math.max(50, scrollPercentage * footerHeight));

      if (currentScrollY < lastScrollY) {
        // Scrolling up
        footer.style.transform = `translateY(calc(100% - ${footerVisibleHeight}px))`;
      } else {
        // Scrolling down
        footer.style.transform = 'translateY(calc(100% - 50px))';
      }
      lastScrollY = currentScrollY;
    };

    const handleResize = () => {
      footerHeight = footer.offsetHeight;
      viewportHeight = window.innerHeight;
      documentHeight = document.documentElement.scrollHeight;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Initial call to set up the footer
    handleResize();
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array to run only once after initial render

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleGuestClick = (guest) => {
    setSelectedGuest(guest);
    setEditedGuest({ ...guest, errors: {} });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedGuest(null);
    setEditedGuest(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return nameRegex.test(value) ? '' : 'Invalid name format (letters only)';
      case 'email':
        return emailRegex.test(value) ? '' : 'Invalid email format';
      case 'phone':
        if (!phoneRegex.test(value)) {
          return "Phone number must be exactly 10 digits.";
        }
        if (/^(\d)\1{9}$/.test(value)) {
          return "Phone number cannot consist of repeating digits.";
        }
        return '';
      case 'dob':
        const datePart = value.split('T')[0];
        return dobRegex.test(datePart) ? '' : 'Invalid date of birth (YYYY-MM-DD)';
      case 'proofNumber':
        return proofNumberRegex.test(value) ? '' : 'Invalid proof number format';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setEditedGuest(prev => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: error
      }
    }));
  };

  const handleSaveEdit = async () => {
    const hasErrors = Object.values(editedGuest.errors).some(error => error !== '');
    if (hasErrors) {
      console.error('Please correct the errors before saving');
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API}/user/update-guest/${editedGuest._id}`, editedGuest);
      if (response.status === 200) {
        setSavedGuests(prevGuests => 
          prevGuests.map(guest => guest._id === editedGuest._id ? editedGuest : guest)
        );
        setIsEditing(false);
        setSelectedGuest(editedGuest);
      } else {
        console.error('Failed to update guest');
      }
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const handleDeleteGuest = async (guestId) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Guest',
        text: 'Are you sure you want to remove this guest? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Deleting Guest',
          text: 'Please wait...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await axios.delete(
          `${import.meta.env.VITE_API}/user/delete-guest/${selectedGuest._id}`
        );

        if (response.status === 200) {
          // Remove guest from state
          setSavedGuests(prevGuests => 
            prevGuests.filter(guest => guest._id !== selectedGuest._id)
          );
          
          // Close modal
          handleCloseModal();

          // Show success message
          await Swal.fire({
            icon: 'success',
            title: 'Guest Deleted',
            text: 'The guest has been successfully removed',
            timer: 1500,
            showConfirmButton: false
          });
        }
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete guest. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div className='SavedGuestnav'>
        <Header />
      </div>

      <div className="saved-guests-container">
        <h2>Saved Guests</h2>
        <br />

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {filteredGuests.length === 0 ? (
          <p>No saved guests found.</p>
        ) : (
          <ul className="saved-guests-list">
            {filteredGuests.slice(0, displayCount).map((guest) => (
              <li key={guest._id} onClick={() => handleGuestClick(guest)}>
                <div className={searchQuery ? 'filtered-guest' : 'guest-card'}>
                  <p><strong>Name:</strong> {guest.name}</p>
                  <p><strong>Email:</strong> {guest.email}</p>
                  <p><strong>Phone:</strong> {guest.phone}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="buttons-container">
          {displayCount < filteredGuests.length && (
            <button className="see-more-button" onClick={() => setDisplayCount(displayCount + 3)}>
              See More
            </button>
          )}
          {displayCount > 3 && (
            <button className="see-less-button" onClick={() => setDisplayCount(3)}>
              Show Less
            </button>
          )}
        </div>
       
      </div>

      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <div className="guest-modal">
          <CloseIcon className="close-icon" onClick={handleCloseModal} />
          {selectedGuest && (
            <div>
              <h2>{selectedGuest.name}</h2>
              {isEditing ? (
                <div>
                  <TextField
                    name="name"
                    label="Name"
                    value={editedGuest.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    error={!!editedGuest.errors.name}
                    helperText={editedGuest.errors.name}
                  />
                  <TextField
                    name="email"
                    label="Email"
                    value={editedGuest.email}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    error={!!editedGuest.errors.email}
                    helperText={editedGuest.errors.email}
                  />
                  <TextField
                    name="phone"
                    label="Phone"
                    value={editedGuest.phone}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    error={!!editedGuest.errors.phone}
                    helperText={editedGuest.errors.phone}
                  />
                  <TextField
                    name="address"
                    label="Address"
                    value={editedGuest.address}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={3}
                  />
                  <TextField
                    name="dob"
                    label="Date of Birth"
                    type="date"
                    value={editedGuest.dob.split('T')[0]}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!editedGuest.errors.dob}
                    helperText={editedGuest.errors.dob}
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Proof Type</InputLabel>
                    <Select
                      name="proofType"
                      value={editedGuest.proofType}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="passport">Passport</MenuItem>
                      <MenuItem value="drivingLicense">Driving License</MenuItem>
                      <MenuItem value="aadhar">Aadhar</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    name="proofNumber"
                    label="Proof Number"
                    value={editedGuest.proofNumber}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    error={!!editedGuest.errors.proofNumber}
                    helperText={editedGuest.errors.proofNumber}
                  />
                  <Button onClick={handleSaveEdit} variant="contained" color="primary">
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div>
                  <p><strong>Email:</strong> {selectedGuest.email}</p>
                  <p><strong>Phone:</strong> {selectedGuest.phone}</p>
                  <p><strong>Address:</strong> {selectedGuest.address}</p>
                  <p><strong>Date of Birth:</strong> {new Date(selectedGuest.dob).toLocaleDateString("en-GB")}</p>
                  <p><strong>Proof Type:</strong> {selectedGuest.proofType}</p>
                  <p><strong>Proof Number:</strong> {selectedGuest.proofNumber}</p>
                  <div>
                    <strong>Proof Document:</strong>
                    {selectedGuest.proofDocument && (
                      <img 
                        src={`${selectedGuest.proofDocument}`}
                        alt="Proof Document"
                        className="proof-document-preview"
                        onClick={() => setFullScreenImage(`${selectedGuest.proofDocument}`)}
                      />
                    )}
                  </div>
                  <div className="button-group">
                    <Button 
                      onClick={handleEditClick} 
                      variant="contained" 
                      color="primary"
                      startIcon={<EditIcon />}
                      sx={{ mr: 2 }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteGuest(selectedGuest._id)}
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {fullScreenImage && (
        <Modal open={!!fullScreenImage} onClose={() => setFullScreenImage(null)}>
          <div className="full-screen-image-container">
            <img src={fullScreenImage} alt="Full Screen Proof Document" className="full-screen-image" />
            <CloseIcon className="close-icon" onClick={() => setFullScreenImage(null)} />
          </div>
        </Modal>
      )}
      <div className='footer'>
      <Footer/>
    </div>
    </div>
    
  );
}

export default SavedGuest;
