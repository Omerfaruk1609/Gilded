import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../../services/auth';

const ProtectedRoute = ({ children }) => {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
