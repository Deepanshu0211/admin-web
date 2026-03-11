import { useEffect, useState } from "react";
import {
    createMessage,
    fetchMessages,
    formatDateTime,
    getStoredAdminSession,
    removeMessage,
    fetchAllPushTokens,
    sendPushNotification,
} from "../lib/admin";
import { Trash2 } from "lucide-react";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadBroadcasts = () => {
    setIsLoading(true);
    fetchMessages()
      .then((msgs) => setBroadcasts(msgs.filter((m) => m.targetUser === null)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await removeMessage(id);
      setBroadcasts(broadcasts.filter(b => b.id !== id));
    } catch(err) {
      alert('Failed to delete broadcast');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    const session = getStoredAdminSession();
    try {
      await createMessage({
        title,
        body,
        sentBy: session?.name || "admin",
        targetUser: null,
        type: "message",
      });
      const tokens = await fetchAllPushTokens();
      await sendPushNotification(title, body, tokens);
      setTitle("");
      setBody("");
      loadBroadcasts();
    } catch (err) {
      alert("Failed to send broadcast");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Broadcasts</h1>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Send Broadcast</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Title
            </label>
            <input
              className="mt-1 block w-full rounded-md border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Message
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Send Broadcast
          </button>
        </form>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Message History</h2>
        {isLoading ? (
          <p>Loading broadcasts...</p>
        ) : (
          <ul className="space-y-4">
            {broadcasts.map((msg) => (
              <li key={msg.id} className="border border-[var(--border-color)] p-4 rounded-lg bg-[var(--bg-primary)] group flex justify-between items-start transition-all hover:border-[var(--accent)] hover:shadow-md">
                <div>
                  <div className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{msg.title}</div>
                  <div className="mt-1" style={{ color: "var(--text-secondary)" }}>{msg.body}</div>
                  <div className="text-xs mt-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {formatDateTime(msg.timestamp)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(msg.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                  title="Delete Broadcast"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
            {broadcasts.length === 0 && (
              <p className="text-[var(--text-secondary)]">No past broadcasts.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
