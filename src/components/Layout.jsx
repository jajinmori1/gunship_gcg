import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}

