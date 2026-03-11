import { CalendarCheck, TrendingUp, UserCheck, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    todayCheckins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(".dash-title", { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
      gsap.fromTo(".dash-card", { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out", delay: 0.05,
      });
      gsap.fromTo(".dash-section", { y: 12, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.4, delay: 0.3, ease: "power2.out",
      });
    }
  }, [loading]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const { data: members } = await supabase
      .from("users")
      .select("*")
      .eq("role", "member")
      .or("is_deleted.is.null,is_deleted.eq.false");

    const total = members?.length || 0;
    let active = 0, expiring = 0, expired = 0;

    members?.forEach((m) => {
      const expiry = m.membership_expiry_date
        ? new Date(m.membership_expiry_date).getTime()
        : 0;
      if (expiry <= now.getTime()) {
        expired++;
      } else {
        const daysLeft = Math.ceil((expiry - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7) expiring++;
        else active++;
      }
    });

    const { count: todayCheckins } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("check_in", today);

    const { data: recent } = await supabase
      .from("users")
      .select("*")
      .eq("role", "member")
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({ total, active, expiring, expired, todayCheckins: todayCheckins || 0 });
    setRecentMembers(recent || []);
    setLoading(false);
  }

  const statCards = [
    { label: "Total Members", value: stats.total, icon: Users, color: "#818cf8", bg: "rgba(129,140,248,0.08)" },
    { label: "Active", value: stats.active, icon: UserCheck, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    { label: "Expiring Soon", value: stats.expiring, icon: TrendingUp, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { label: "Today Check-ins", value: stats.todayCheckins, icon: CalendarCheck, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <h1 className="dash-title text-2xl font-bold mb-6 text-[var(--text-primary)]">
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="dash-card card card-hover p-5"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {card.label}
              </span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon className="w-[18px] h-[18px]" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[var(--text-primary)]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Expired alert */}
      {stats.expired > 0 && (
        <div className="dash-section card mb-6 p-4 flex items-center gap-3"
          style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            <span style={{ color: "#ef4444", fontSize: 16 }}>⚠</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
              {stats.expired} member{stats.expired > 1 ? "s" : ""} expired
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Membership ended — needs renewal
            </p>
          </div>
        </div>
      )}

      {/* Recent Members */}
      <div className="dash-section">
        <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)]">
          Recent Members
        </h2>
        <div className="card overflow-hidden">
          {recentMembers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-tertiary)]">
              No members registered yet
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
              {recentMembers.map((m) => {
                const expiry = m.membership_expiry_date
                  ? new Date(m.membership_expiry_date)
                  : null;
                const isExpired = expiry ? expiry.getTime() < Date.now() : false;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden"
                        style={{
                          background: `hsl(${Math.abs(m.name?.charCodeAt(0) * 37) % 360}, 40%, 50%)`,
                          color: "#fff",
                        }}
                      >
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          m.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{m.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{m.phone_number}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      isExpired ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                    }`}>
                      {isExpired ? "Expired" : "Active"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
