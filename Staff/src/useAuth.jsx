import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const useAuth = () => {
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      history('/stafflogin');
      // Optionally show a session expired message
      Swal.fire('Error','Session expired. Please log in again.','error');
    }
  }, [history]);
};

export default useAuth;
