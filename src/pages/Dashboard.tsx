import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      // Get total members
      const { count: total } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active members (assuming subscription_end > now)
      const { count: active } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('subscription_end', new Date().toISOString());

      // Get today's check-ins
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in', today);

      setStats({
        total: total || 0,
        active: active || 0,
        today: todayCount || 0
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-medium text-gray-500">Total Members</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? '...' : stats.total}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-medium text-gray-500">Active Members</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {loading ? '...' : stats.active}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-medium text-gray-500">Today's Check-ins</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {loading ? '...' : stats.today}
          </p>
        </div>
      </div>
    </div>
  );
}
