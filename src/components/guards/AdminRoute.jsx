import { Navigate } from 'react-router-dom';
import { getStoredUser, isAdminUser } from '../../services/auth';

const AdminRoute = ({ children }) => {
  const user = getStoredUser();
  if (!user || !isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default AdminRoute;
