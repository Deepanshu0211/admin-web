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
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Today's Attendance</h1>
      <div className="bg-[var(--bg-surface)] rounded-xl shadow overflow-hidden border border-[var(--border-color)]">
        <ul className="divide-y divide-[var(--border-color)]">
          {loading ? (
            <li className="p-6 text-center text-[var(--text-secondary)]">Loading...</li>
          ) : attendance.length === 0 ? (
            <li className="p-6 text-center text-[var(--text-secondary)]">No attendance records for today.</li>
          ) : attendance.map((record) => (
            <li key={record.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{record.users?.name || 'Unknown'}</p>
                <p className="text-sm text-[var(--text-secondary)]">{record.users?.phone_number || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-400 bg-green-900/30 font-semibold px-2 py-1 rounded inline-block">
                  In: {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {record.check_out && (
                  <p className="text-sm text-red-400 bg-red-900/30 font-semibold px-2 py-1 rounded inline-block mt-1">
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
