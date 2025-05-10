import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import PublicLayout from '../components/layouts/PublicLayout';
import PrivateLayout from '../components/layouts/PrivateLayout';
import RequireAuth from '../components/RequireAuth';

import Home from '../pages/site/Home';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';

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
    element: <PublicLayout />,
    children: [
      { path: 'login', element: <Login /> },
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
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
