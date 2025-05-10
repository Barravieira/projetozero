import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Center } from '@mantine/core';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Outlet />
    </Center>
  );
}
