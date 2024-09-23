import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const useAuth = () => {
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      history('/adminlogin');
      // Optionally show a session expired message
      Swal.fire('Session expired. Please log in again.');
    }
  }, [history]);
};

export default useAuth;
