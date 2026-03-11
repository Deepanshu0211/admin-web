import { useState, useEffect } from "react";
import { fetchGymStatus, updateGymStatus, getStoredAdminSession } from "../lib/admin";
import { formatDateTime } from "../lib/admin";
import { Power, Users, Clock, Activity } from "lucide-react";

export default function GymControl() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const loadStatus = () => {
    setIsLoading(true);
    fetchGymStatus()
      .then(setStatus)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggle = async () => {
    if (!status || isToggling) return;
    setIsToggling(true);
    const session = getStoredAdminSession();
    try {
      await updateGymStatus(!status.isOpen, session?.name || "admin");
      await fetchGymStatus().then(setStatus);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gym Control</h1>
      
      {isLoading ? (
        <div className="bg-[var(--bg-surface)] rounded-xl p-8 skeleton h-64 max-w-2xl mx-auto"></div>
      ) : (
        <div className="max-w-2xl mx-auto mt-8 relative animate-fade-in-up duration-500">
          {/* Animated Glow Background */}
          <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-30 transition duration-1000 ${status?.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-10 shadow-2xl flex flex-col items-center text-center transition-all duration-500 overflow-hidden">
            
            {/* Background design element */}
            <div className="absolute -top-16 -right-16 opacity-[0.03] pointer-events-none">
              <Activity className="w-64 h-64" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 z-10 tracking-wide">Current Status</h2>
            <div className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mb-8 z-10 bg-[var(--bg-primary)] px-4 py-1.5 rounded-full border border-[var(--border-color)]">
              <Clock className="w-4 h-4" /> 
              Updated: {status?.lastUpdated ? formatDateTime(status.lastUpdated) : 'Never'}
            </div>
            
            {/* Big Status Badge */}
            <div className={`mb-12 px-10 py-4 rounded-full text-3xl font-black uppercase tracking-widest transition-all duration-500 z-10 ${status?.isOpen ? 'bg-green-900/30 text-green-400 border-2 border-green-800/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]' : 'bg-red-900/30 text-red-500 border-2 border-red-800/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
              {status?.isOpen ? "GYM IS OPEN" : "GYM IS CLOSED"}
            </div>

            {/* Power Button */}
            <button 
              className={`group relative flex items-center justify-center p-8 rounded-full text-white font-bold transition-all duration-300 shadow-2xl overflow-hidden z-10 ${isToggling ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'} ${status?.isOpen ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-900/50 hover:shadow-red-500/50' : 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-900/50 hover:shadow-green-500/50'}`}
              onClick={handleToggle}
              disabled={isToggling}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Power className={`w-20 h-20 transition-transform duration-500 ${isToggling ? 'animate-pulse scale-90' : ''}`} />
            </button>
            
            <p className="mt-8 text-xl font-medium text-[var(--text-secondary)] z-10">
              {isToggling ? "Updating Status..." : status?.isOpen ? "Tap to Close Gym" : "Tap to Open Gym"}
            </p>

            {status?.updatedBy && (
              <div className="mt-10 px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-tertiary)] flex items-center justify-center gap-2 z-10">
                <Users className="w-4 h-4" /> Changed by: <span className="font-bold text-[var(--text-primary)]">{status.updatedBy}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
