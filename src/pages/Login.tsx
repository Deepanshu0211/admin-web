import { useState } from "react";
import { fetchAdminByPhone, saveAdminSession } from "../lib/admin";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const adminSession = await fetchAdminByPhone(phone);

      if (!adminSession) {
        setError("No account found with this phone number.");
        setLoading(false);
        return;
      }

      saveAdminSession(adminSession);
      onLogin();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(199, 90, 44, 0.15), transparent 28%), radial-gradient(circle at bottom right, rgba(223, 142, 77, 0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0))",
        }}
      />

      <div className="animate-fade-in-up max-w-md w-full mx-4">
        <div
          className="rounded-[32px] p-8 border shadow-[0_30px_90px_rgba(61,46,30,0.12)]"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-[28px] overflow-hidden mb-4 animate-pulse-glow ring-1 ring-black/5">
              <img
                src="/logo.jpeg"
                alt="Legend Fitness"
                className="w-full h-full object-cover"
              />
            </div>
            <p
              className="text-[11px] uppercase tracking-[0.3em] mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Legend Gym
            </p>
            <h1
              className="text-3xl font-bold text-center"
              style={{ color: "var(--text-primary)" }}
            >
              Legend Fitness
            </h1>
            <p
              className="text-sm mt-2 text-center max-w-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in with an admin phone number to manage members, attendance,
              gym control, and broadcasts.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold tracking-wider mb-2 uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-red-500/30"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: error ? "var(--danger)" : "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {error && (
              <div
                className="animate-fade-in flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--danger)",
                }}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, var(--accent), #df8e4d)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p
            className="text-center text-xs mt-6"
            style={{ color: "var(--text-tertiary)" }}
          >
            Admin access only
          </p>
        </div>
      </div>
    </div>
  );
}
