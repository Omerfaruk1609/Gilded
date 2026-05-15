import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../../services/auth';

const PublicOnlyRoute = ({ children }) => {
  const user = getStoredUser();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PublicOnlyRoute;
