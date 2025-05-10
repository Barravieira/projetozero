import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import PublicLayout from '../components/layouts/PublicLayout';
import PrivateLayout from '../components/layouts/PrivateLayout';
import RequireAuth from '../components/RequireAuth';

import Home from '../pages/site/Home';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import Signup from '../pages/auth/Signup';
import Recovey from '../pages/auth/Recovery';
import Settings from '../pages/dashboard/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
    ],
  },
  {
    path: '/app/auth',
    element: <AuthLayout />,
    children: [
      { path: 'entrar', element: <Login /> },
      { path: 'cadastrar', element: <Signup /> },
      { path: 'recuperar', element: <Recovey /> },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <PrivateLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'configuracoes', element: <Settings /> }
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
