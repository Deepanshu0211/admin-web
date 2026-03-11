import {
    CalendarCheck,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Radio,
    Users,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession, getStoredAdminSession } from "../lib/admin";
import PageTransition from "../components/PageTransition";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function DashboardLayout({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getStoredAdminSession();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (location.pathname === href) return;
    const event = new CustomEvent("start-page-transition", {
      detail: { callback: () => navigate(href) }
    });
    window.dispatchEvent(event);
  };

  useGSAP(() => {
    gsap.fromTo(sidebarRef.current, { x: -30, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.5, ease: "power3.out",
    });
    gsap.fromTo(".nav-item", { x: -16, opacity: 0 }, {
      x: 0, opacity: 1, stagger: 0.04, duration: 0.35, delay: 0.08,
      ease: "power2.out", clearProps: "all",
    });
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    onLogout();
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Members", href: "/members", icon: Users },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Gym Control", href: "/control", icon: Radio },
    { name: "Broadcasts", href: "/broadcasts", icon: Megaphone },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="hidden md:flex md:w-[260px] flex-shrink-0 flex-col border-r h-screen sticky top-0"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/5">
              <img src="/logo.jpeg" alt="Legend" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest text-[var(--text-primary)]">
                LEGEND
              </span>
              <span className="block text-[10px] tracking-widest uppercase text-[var(--text-tertiary)]">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavigation(e, item.href)}
                className="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  boxShadow: isActive ? "0 4px 16px rgba(229,57,53,0.25)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-surface)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <item.icon
                  className="flex-shrink-0 h-[17px] w-[17px]"
                  style={{ color: isActive ? "#fff" : "var(--text-tertiary)" }}
                />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: "var(--border-color)" }}>
          {/* Admin info */}
          <div className="px-3 py-2.5 mb-1">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {session?.name ?? "Admin"}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
              {session?.phone ?? "—"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-150 cursor-pointer"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut className="h-[17px] w-[17px]" style={{ color: "var(--text-tertiary)" }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/5">
            <img src="/logo.jpeg" alt="Legend" className="w-full h-full object-cover" />
          </div>
          <span className="text-[13px] font-bold tracking-widest text-[var(--text-primary)]">LEGEND</span>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 border-t"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors"
              style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}
            >
              <item.icon className="h-5 w-5" />
              {item.name.split(" ")[0]}
            </a>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full relative md:pt-0 pt-14 pb-20 md:pb-0">
        <PageTransition>
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto min-h-full">
            <Outlet />
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
