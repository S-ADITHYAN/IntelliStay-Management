import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const LoginAuth = () => {
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      history('/');
      // Optionally show a session expired message
      
    }
  }, [history]);
};

export default LoginAuth;