import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, LogOut, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DashboardLayout() {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-900 shadow-xl text-white flex-shrink-0">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <Dumbbell className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-xl font-bold tracking-wider">LEGEND APP</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } group flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    } flex-shrink-0 -ml-1 mr-3 h-5 w-5`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="text-gray-400 group-hover:text-white mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
