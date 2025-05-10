import { Outlet } from 'react-router-dom';

export default function PrivateLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* header lateral, menu etc. */}
      <Outlet />
    </div>
  );
}
