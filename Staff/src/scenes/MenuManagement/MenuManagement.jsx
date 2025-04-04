import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUpload,
  FaSearch,
  FaArrowLeft,
  FaCube,
  FaCheckCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './MenuManagement.css';
import { useTheme } from '@mui/material';
import { tokens } from "../../theme";
import { RiLeafFill } from 'react-icons/ri';
import { GiMeat } from 'react-icons/gi';
import GenerateMenuPDFButton from '../../components/GenerateMenuPDFButton';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import ARView from './ARView';
import { Button } from '@mui/material';

const PREDEFINED_CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Soups',
  'Salads',
  'Sides',
  'Specials',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Vegan',
  'Vegetarian',
  'Gluten-Free'
];

const SPICY_LEVELS = ['Not Spicy', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const SPECIAL_TAGS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Organic', 'Chef Special'];

const MenuManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // States
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(PREDEFINED_CATEGORIES);
  const [categoriesError, setCategoriesError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    preparationTime: '',
    specialTags: [],
    spicyLevel: '',
    isAvailable: true,
    foodType: 'Veg',
    quantity: 1
  });

  // Add new states for AR preview
  const [previewUrl, setPreviewUrl] = useState('');
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/staff/getmenuitems`);
      setMenuItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/staff/restaurant/categories`);
      // Merge predefined categories with fetched categories and remove duplicates
      const allCategories = [...new Set([...PREDEFINED_CATEGORIES, ...(Array.isArray(response.data) ? response.data : [])])];
      setCategories(allCategories);
      setCategoriesError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to predefined categories if API fails
      setCategories(PREDEFINED_CATEGORIES);
      setCategoriesError('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show loading state
    Swal.fire({
      title: editingItem ? 'Updating Menu Item' : 'Adding Menu Item',
      text: 'Please wait...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Validate form data
      const errors = validateFormData(formData);
      if (errors.length > 0) {
        await Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          html: errors.join('<br>'),
          confirmButtonColor: baseColors.danger
        });
        return;
      }

      const formDatas = new FormData();
      
      // Convert price to number and validate
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price value');
      }

      // Convert preparation time to number
      const prepTime = parseInt(formData.preparationTime) || 30;
      
      // Convert quantity to number
      const quantity = parseInt(formData.quantity) || 1;

      // Append all form data with proper type conversion
      formDatas.append('name', formData.name.trim());
      formDatas.append('description', formData.description.trim());
      formDatas.append('price', price.toString());
      formDatas.append('category', formData.category.trim());
      formDatas.append('preparationTime', prepTime.toString());
      formDatas.append('specialTags', JSON.stringify(formData.specialTags));
      formDatas.append('spicyLevel', formData.spicyLevel);
      formDatas.append('isAvailable', formData.isAvailable.toString());
      formDatas.append('foodType', formData.foodType);
      formDatas.append('quantity', quantity.toString());

      // Only append image if it's a new file
      if (formData.image instanceof File) {
        formDatas.append('image', formData.image);
      }

      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      };

      // Log the form data for debugging
      console.log('Form data being sent:', Object.fromEntries(formDatas.entries()));

      let response;
      if (editingItem) {
        if (!editingItem._id) {
          throw new Error('Invalid item ID');
        }
        response = await axios.put(
          `${import.meta.env.VITE_API}/staff/menu/${editingItem._id}`,
          formDatas,
          config
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API}/staff/menu`,
          formDatas,
          config
        );
      }

      await Swal.fire({
        icon: 'success',
        title: editingItem ? 'Updated!' : 'Added!',
        text: editingItem ? 'Menu item has been updated successfully' : 'Menu item has been added successfully',
        timer: 1500,
        showConfirmButton: false
      });

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      await fetchMenuItems();

    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Failed to process menu item';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: baseColors.danger
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      specialTags: item.specialTags,
      spicyLevel: item.spicyLevel,
      isAvailable: item.isAvailable,
      foodType: item.foodType || 'Veg',
      quantity: item.quantity || 1
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    try {
        // Initial confirmation dialog
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (confirmResult.isConfirmed) {
            // Show loading state
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while we process your request',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Send delete request
            const response = await axios.delete(`${import.meta.env.VITE_API}/staff/menu/${itemId}`);

            if (response.data.note) {
                // Item was archived instead of deleted
                await Swal.fire({
                    icon: 'info',
                    title: 'Item Archived',
                    text: response.data.message,
                    footer: response.data.note,
                    confirmButtonColor: '#3085d6'
                });
            } else {
                // Item was successfully deleted
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The menu item has been deleted.',
                    timer: 1500,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            }

            // Refresh menu items
            await fetchMenuItems();
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        
        // Handle different error scenarios
        if (error.response?.status === 400 && error.response?.data?.details?.activeOrdersCount) {
            // Cannot delete due to active orders
            await Swal.fire({
                icon: 'error',
                title: 'Cannot Delete Item',
                html: `
                    <p>${error.response.data.message}</p>
                    <p>Active Orders: ${error.response.data.details.activeOrdersCount}</p>
                    <p><small>${error.response.data.details.suggestion}</small></p>
                `,
                confirmButtonColor: '#3085d6'
            });
        } else if (error.response?.status === 404) {
            // Item not found
            await Swal.fire({
                icon: 'error',
                title: 'Not Found',
                text: 'This menu item no longer exists.',
                confirmButtonColor: '#3085d6'
            });
            // Refresh to update the list
            await fetchMenuItems();
        } else {
            // Generic error
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete menu item',
                confirmButtonColor: '#3085d6',
                footer: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
};

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(`${import.meta.env.VITE_API}/staff/menu/bulk-upload`, 
          formData
        );
        fetchMenuItems();
      } catch (error) {
        console.error('Error bulk uploading menu items:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null,
      preparationTime: '',
      specialTags: [],
      spicyLevel: '',
      isAvailable: true,
      foodType: 'Veg',
      quantity: 1
    });
  };

  const filteredItems = menuItems?.filter(item => {
    if (!item) return false;
    const matchesSearch = (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = filter === 'all' || item.category === filter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Define base colors for fallback
  const baseColors = {
    background: colors?.primary?.[400] || '#f0f0f0',
    surface: colors?.primary?.[500] || '#ffffff',
    text: colors?.primary?.[100] || '#000000',
    textSecondary: colors?.primary?.[200] || '#666666',
    border: colors?.grey?.[300] || '#dddddd',
    primary: colors?.greenAccent?.[600] || '#4caf50',
    secondary: colors?.blueAccent?.[600] || '#2196f3',
    danger: colors?.redAccent?.[600] || '#f44336',
    success: colors?.greenAccent?.[700] || '#388e3c',
    error: colors?.redAccent?.[700] || '#d32f2f'
  };
  const handleBack = () => {
    navigate(-1); // Goes back to previous page
  };

  const CategorySelect = () => (
    <select 
      className="category-select"
      value={filter} 
      onChange={(e) => setFilter(e.target.value)}
      style={{ 
        backgroundColor: baseColors.surface,
        color: baseColors.text,
        borderColor: baseColors.border,
        padding: '8px',
        borderRadius: '4px',
        width: '200px',
        cursor: 'pointer',
        // Add these to ensure visibility
        fontSize: '14px',
        appearance: 'auto',
        opacity: 1
      }}
    >
      <option value="all">All Categories</option>
      {categories.length > 0 ? (
        categories.map(category => (
          <option 
            key={category} 
            value={category}
            style={{
              backgroundColor: baseColors.surface,
              color: baseColors.text
            }}
          >
            {category}
          </option>
        ))
      ) : (
        <option value="" disabled>No categories available</option>
      )}
    </select>
  );

  // Add this validation function
  const validateFormData = (data) => {
    const errors = [];
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.description?.trim()) errors.push('Description is required');
    if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
      errors.push('Valid price is required');
    }
    if (!data.category?.trim()) errors.push('Category is required');
    return errors;
  };

  // Update the handlePreviewAR function
  const handlePreviewAR = (item) => {
    if (item?._id) {
      navigate(`/ar/${item._id}`);
    }
  };

  const handleUpload3DModel = async (itemId) => {
    const { value: file } = await Swal.fire({
      title: 'Select 3D Model',
      input: 'file',
      inputAttributes: {
        'accept': '.glb',
        'aria-label': 'Upload your 3D model'
      },
      html: `
        <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
          <p>File size guidelines:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Maximum file size: 100MB</li>
            <li>Accepted format: .glb</li>
          </ul>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Upload',
      showLoaderOnConfirm: true,
      preConfirm: (file) => {
        if (!file) {
          Swal.showValidationMessage('Please select a file');
          return;
        }
        if (file.size > 100 * 1024 * 1024) {
          Swal.showValidationMessage('File is too large. Maximum size is 100MB');
          return;
        }
        return file;
      }
    });

    if (file) {
      try {
        const formData = new FormData();
        formData.append('model3D', file);

        const loadingAlert = Swal.fire({
          title: 'Uploading...',
          html: 'Uploading your 3D model...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await axios.post(
          `${import.meta.env.VITE_API}/staff/menu/upload-model/${itemId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            timeout: 30000
          }
        );

        await loadingAlert.close();

        if (response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Uploaded!',
            text: '3D model has been uploaded successfully',
            timer: 1500
          });

          await fetchMenuItems();
        }

      } catch (error) {
        console.error('Error uploading 3D model:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: error.response?.data?.message || 'Failed to upload 3D model. Please try again.'
        });
      }
    }
  };

  return (
    <div className="menu-management" style={{ backgroundColor: baseColors.surface }}>
      <div className="page-header">
        <button 
          className="back-btn" 
          onClick={handleBack}
          style={{ color: baseColors.text }}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="menu-header" style={{ backgroundColor: baseColors.background }}>
        <h2 style={{ color: baseColors.text }}>Menu Management</h2>
        <div className="menu-actions">
          <GenerateMenuPDFButton menuItems={menuItems} />
          <button 
            className="add-btn" 
            style={{ 
              backgroundColor: baseColors.primary,
              color: baseColors.text 
            }}
            onClick={() => setShowForm(true)}
          >
            <FaPlus /> Add Item
          </button>
        </div>
      </div>

      <div className="menu-filters" style={{ backgroundColor: baseColors.background }}>
        <div className="search-bar">
          <FaSearch style={{ color: baseColors.text }} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              backgroundColor: baseColors.surface,
              color: baseColors.text,
              borderColor: baseColors.border
            }}
          />
        </div>
        {categoriesError ? (
          <div style={{ color: baseColors.error }}>{categoriesError}</div>
        ) : (
          <CategorySelect />
        )}
      </div>

      <div className="menu-grid">
        {filteredItems?.map(item => (
          <div 
            key={item._id} 
            className="menu-item-card" 
            style={{ backgroundColor: baseColors.surface }}
          >
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h3 style={{ color: baseColors.text }}>{item.name}</h3>
              <p style={{ color: baseColors.textSecondary }}>{item.description}</p>
              <div className="item-meta">
                <span className="price" style={{ color: baseColors.primary }}>
                  ₹{item.price}
                </span>
                <span 
                  className={`status ${item.isAvailable ? 'available' : 'unavailable'}`}
                  style={{ 
                    backgroundColor: item.isAvailable ? baseColors.success : baseColors.error,
                    color: baseColors.text
                  }}
                >
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <span 
                  className={`food-type ${item.foodtype?.toLowerCase()}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 8px',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    marginRight: '8px',
                    color: baseColors.text
                  }}
                >
                  {item.foodtype === 'Veg' ? (
                    <RiLeafFill style={{ color: '#2e7d32' }} />
                  ) : (
                    <GiMeat style={{ color: '#d32f2f' }} />
                  )}
                  {item.foodtype}
                </span>
              </div>
              <div className="item-actions">
                <Button
                  onClick={() => handlePreviewAR(item)}
                  startIcon={<FaCube />}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  {item.model3D ? 'Preview AR' : 'Preview Default AR'}
                </Button>
                <button 
                  onClick={() => handleUpload3DModel(item._id)}
                  style={{ 
                    backgroundColor: baseColors.secondary,
                    color: baseColors.text 
                  }}
                >
                  {item.model3D ? (
                    <>
                      <FaCheckCircle style={{ color: '#4CAF50' }} /> Update 3D Model
                    </>
                  ) : (
                    <>
                      <FaUpload /> Upload 3D Model
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleEdit(item)}
                  style={{ 
                    backgroundColor: baseColors.secondary,
                    color: baseColors.text 
                  }}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item._id)}
                  style={{ 
                    backgroundColor: baseColors.danger,
                    color: baseColors.text 
                  }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ backgroundColor: baseColors.background }}>
            <h3 style={{ color: baseColors.text }}>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{color:baseColors.text}}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    // Only allow letters and spaces, remove other characters
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setFormData({...formData, name: value});
                  }}
                  onKeyPress={(e) => {
                    // Prevent entering numbers and special characters
                    if (!/[A-Za-z\s]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                  pattern="[A-Za-z\s]+"
                  title="Please enter only letters and spaces"
                  style={{ 
                    backgroundColor: baseColors.surface,
                    color: baseColors.text,
                    borderColor: baseColors.border
                  }}
                />
              </div>

              <div className="form-group">
                <label style={{color:baseColors.text}}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  style={{ 
                    backgroundColor: baseColors.surface,
                    color: baseColors.text,
                    borderColor: baseColors.border
                  }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{color:baseColors.text}}>Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    min="0"
                    step="1"
                    required
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{color:baseColors.text}}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{color:baseColors.text}}>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{color:baseColors.text}}>Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{color:baseColors.text}}>Spicy Level</label>
                  <select
                    value={formData.spicyLevel}
                    onChange={(e) => setFormData({...formData, spicyLevel: e.target.value})}
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  >
                    <option value="">Select Spicy Level</option>
                    {SPICY_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{color:baseColors.text}}>Special Tags</label>
                <div className="tags-container" style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  marginTop: '8px' 
                }}>
                  {SPECIAL_TAGS.map(tag => (
                    <label key={tag} style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '4px',
                      color: baseColors.text 
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.specialTags.includes(tag)}
                        onChange={(e) => {
                          const updatedTags = e.target.checked
                            ? [...formData.specialTags, tag]
                            : formData.specialTags.filter(t => t !== tag);
                          setFormData({...formData, specialTags: updatedTags});
                        }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{color:baseColors.text}}>Food Type</label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                    required
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{color: baseColors.text}}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: Math.max(1, parseInt(e.target.value))})}
                    required
                    style={{ 
                      backgroundColor: baseColors.surface,
                      color: baseColors.text,
                      borderColor: baseColors.border
                    }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{color:baseColors.text}}>Available</label>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" style={{ backgroundColor: baseColors.primary }}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  style={{ backgroundColor: baseColors.danger ,color: baseColors.text }}
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement; 