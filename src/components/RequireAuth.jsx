import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const isAuthenticated = true; // trocar para verificação real com Firebase depois

  if (!isAuthenticated) {
    return <Navigate to="/site/app/auth/login" replace />;
  }

  return children;
}
