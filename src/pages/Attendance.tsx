import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Attendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select(`
          id,
          check_in,
          check_out,
          users (
            name,
            phone_number
          )
        `)
        .gte('check_in', today)
        .order('check_in', { ascending: false });

      setAttendance(data || []);
      setLoading(false);
    }
    loadAttendance();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Today's Attendance</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-6 text-center text-gray-500">Loading...</li>
          ) : attendance.length === 0 ? (
            <li className="p-6 text-center text-gray-500">No attendance records for today.</li>
          ) : attendance.map((record) => (
            <li key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{record.users?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{record.users?.phone_number || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 bg-green-100 px-2 py-1 rounded">
                  In: {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {record.check_out && (
                  <p className="text-sm text-gray-500 mt-1">
                    Out: {new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
