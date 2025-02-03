import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaChair, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './TableManagement.css';
import { useTheme } from '@mui/material';
import { tokens } from "../../theme";
import Swal from 'sweetalert2';

const TableManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Define base colors for fallback
  const baseColors = {
    text: colors?.primary?.[100] || '#000000',
    background: colors?.primary?.[400] || '#f0f0f0',
    surface: colors?.primary?.[500] || '#ffffff',
    textSecondary: colors?.grey?.[200] || '#666666',
    border: colors?.grey?.[300] || '#dddddd',
  };

  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: 'Indoor',
    status: 'Available'
  });
  const [lastTableNumber, setLastTableNumber] = useState(0);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/staff/restaurant/tables`);
      const tables = Array.isArray(response.data.data) ? response.data.data : [];
      setTables(tables);
      
      // Find the highest table number
      if (tables.length > 0) {
        const maxTableNumber = Math.max(...tables.map(table => parseInt(table.tableNumber)));
        setLastTableNumber(maxTableNumber);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show loading state
    Swal.fire({
        title: 'Processing...',
        text: editingTable ? 'Updating table' : 'Adding new table',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        if (editingTable) {
            await axios.put(
                `${import.meta.env.VITE_API}/staff/restaurant/tables/${editingTable._id}`, 
                formData
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Table updated successfully',
                timer: 1500
            });
        } else {
            await axios.post(
                `${import.meta.env.VITE_API}/staff/restaurant/tables`, 
                formData
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'New table added successfully',
                timer: 1500
            });
        }

        // Refresh table list and reset form
        await fetchTables();
        setShowForm(false);
        setEditingTable(null);
        resetForm();

    } catch (error) {
        console.error('Error saving table:', error);
        
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'Failed to save table. Please try again.',
            confirmButtonColor: '#d33'
        });
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      status: table.status
    });
    setShowForm(true);
  };

  const handleDelete = async (tableId) => {
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        // If user confirms deletion
        if (result.isConfirmed) {
            // Show loading state
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while we delete the table',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Send delete request
            await axios.delete(`${import.meta.env.VITE_API}/staff/restaurant/tables/${tableId}`);
            
            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Table has been deleted successfully',
                timer: 1500,
                showConfirmButton: false
            });

            // Refresh table list
            await fetchTables();
        }
    } catch (error) {
        console.error('Error deleting table:', error);
        
        // Show error message
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'Failed to delete table. Please try again.',
            confirmButtonColor: '#d33'
        });
    }
  };

  const resetForm = () => {
    setFormData({
      tableNumber: (lastTableNumber + 1).toString(), // Auto-increment table number
      capacity: '',
      location: 'Indoor',
      status: 'Available'
    });
  };

  useEffect(() => {
    // Set initial form data with next table number
    if (!editingTable) {
      setFormData(prev => ({
        ...prev,
        tableNumber: (lastTableNumber + 1).toString()
      }));
    }
  }, [lastTableNumber, editingTable]);

  const handleBack = () => {
    navigate(-1); // Goes back to previous page
  };

  return (
    <div className="table-management">
      <div className="page-header">
        <button 
          className="back-btn" 
          onClick={handleBack}
          style={{ color: baseColors.text }}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="table-header">
        <h2>Table Management</h2>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <FaPlus /> Add Table
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Table Number</label>
                <input
                  type="number"
                  value={formData.tableNumber}
                  readOnly // Make it read-only
                  className="readonly-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="balcony">Balcony</option>
                  <option value="private">Private Room</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingTable ? 'Update Table' : 'Add Table'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTable(null);
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

      <div className="tables-grid">
        {Array.isArray(tables) && tables.map(table => (
          <div key={table._id} className={`table-card ${table.status}`}>
            <div className="table-icon">
              <FaChair size={24} />
            </div>
            <div className="table-info">
              <h3>Table {table.tableNumber}</h3>
              <p>Capacity: {table.capacity} persons</p>
              <p>Location: {table.location}</p>
              <p className="status">Status: {table.status}</p>
            </div>
            <div className="table-actions">
              <button onClick={() => handleEdit(table)} className="edit-btn">
                <FaEdit /> Edit
              </button>
              <button onClick={() => handleDelete(table._id)} className="delete-btn">
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableManagement; 